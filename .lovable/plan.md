

## Plan: Add Flutterwave Secret Key

### What's already done
The edge functions (`flutterwave-init` and `flutterwave-webhook`) and the updated Checkout/OrderConfirmation pages are already built. The only missing piece is the API key.

### Steps

**1. Add the `FLUTTERWAVE_SECRET_KEY` secret**
- Use the `add_secret` tool to prompt you to securely enter your Flutterwave secret key
- You can find this in your [Flutterwave Dashboard](https://dashboard.flutterwave.com) → **Settings → API Keys** → copy the **Secret Key** (starts with `FLWSECK_...`)

**2. (Optional) Add `FLUTTERWAVE_WEBHOOK_HASH` secret**
- For extra webhook security, you can also set a webhook hash from Flutterwave Dashboard → **Settings → Webhooks**
- This is optional but recommended for production

**3. Configure webhook URL in Flutterwave Dashboard**
- In Flutterwave Dashboard → **Settings → Webhooks**, set the webhook URL to:
  `https://azihsucbdghiireoolad.supabase.co/functions/v1/flutterwave-webhook`

**4. Deploy edge functions**
- Ensure both `flutterwave-init` and `flutterwave-webhook` are deployed

**5. Test the checkout flow**
- Add items to cart, go to checkout, fill in details, and click "Pay with Flutterwave"
- Verify redirect to Flutterwave payment page and return to order confirmation

### No code changes needed
All code is already in place. This is purely a configuration step.

