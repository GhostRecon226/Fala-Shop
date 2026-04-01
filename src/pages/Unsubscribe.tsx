import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setSubmitting(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating your request…</p>
          </>
        )}
        {status === "valid" && (
          <>
            <MailX className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl font-semibold">Unsubscribe</h1>
            <p className="text-muted-foreground">
              Click below to stop receiving emails from us.
            </p>
            <Button onClick={handleUnsubscribe} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Unsubscribe
            </Button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-semibold">You've been unsubscribed</h1>
            <p className="text-muted-foreground">
              You won't receive any more emails from us.
            </p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Already unsubscribed</h1>
            <p className="text-muted-foreground">
              This email address has already been unsubscribed.
            </p>
          </>
        )}
        {status === "invalid" && (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-semibold">Invalid link</h1>
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground">
              Please try again later or contact support.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
