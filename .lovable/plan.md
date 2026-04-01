

## Plan: Add Flutterwave Secrets

### Steps

**1. Add `FLUTTERWAVE_SECRET_KEY` secret**
- Use the `add_secret` tool to securely prompt you to enter your Flutterwave secret key
- Find it in your **Flutterwave Dashboard → Settings → API Keys** → copy the **Secret Key** (starts with `FLWSECK_...`)

**2. Add `FLUTTERWAVE_WEBHOOK_HASH` secret**
- Use the `add_secret` tool to securely prompt you for the webhook hash
- Set this in your **Flutterwave Dashboard → Settings → Webhooks** — you create this value yourself

**3. Deploy edge functions**
- Deploy both `flutterwave-init` and `flutterwave-webhook` to ensure they pick up the new secrets

**4. Verify deployment**
- Test the `flutterwave-init` function with a quick curl to confirm it responds (expects auth + body, so a basic check is sufficient)

### No code changes needed
All edge function code and frontend code is already in place. This is purely adding the two secrets and deploying.

