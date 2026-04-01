import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const flutterwaveSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flutterwaveSecret) {
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the webhook signature
    const secretHash = req.headers.get("verif-hash");
    const expectedHash = Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH");
    if (expectedHash && secretHash !== expectedHash) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const { event, data } = payload;

    if (event !== "charge.completed") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionId = data.id;
    const txRef = data.tx_ref;

    // Verify the transaction with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: { Authorization: `Bearer ${flutterwaveSecret}` },
      }
    );

    const verifyData = await verifyRes.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (
      verifyData.status === "success" &&
      verifyData.data.status === "successful"
    ) {
      await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_reference: String(transactionId),
        })
        .eq("id", txRef);

      // Send order confirmation email
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("id, total, shipping_address")
          .eq("id", txRef)
          .single();

        if (order) {
          const address = order.shipping_address as Record<string, any>;
          const email = address?.email;
          const name = address?.firstName || address?.name;

          if (email) {
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "order-confirmation",
                recipientEmail: email,
                idempotencyKey: `order-confirm-${order.id}`,
                templateData: {
                  orderId: order.id,
                  total: Number(order.total).toLocaleString(),
                  customerName: name,
                },
              },
            });
          }
        }
      } catch (emailErr) {
        console.error("Failed to send order confirmation email:", emailErr);
        // Don't fail the webhook — order is already confirmed
      }
    } else {
      await supabase
        .from("orders")
        .update({
          status: "failed",
          payment_reference: String(transactionId),
        })
        .eq("id", txRef);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
