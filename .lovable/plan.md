

## Plan: Integrate Flutterwave Payment Gateway

### Overview
Replace the current direct "Place Order" flow with Flutterwave's hosted payment page. Orders are created first, then the user is redirected to Flutterwave to pay. On successful payment, a webhook confirms the payment and updates the order status.

### Flow
```text
Checkout Form → Create Order (status: "pending") → Call Edge Function
→ Flutterwave Hosted Payment Page → User Pays → Redirect back to /order-confirmation?tx_ref=...
→ Webhook Edge Function verifies payment → Updates order status to "confirmed"
```

### Secret Required
- `FLUTTERWAVE_SECRET_KEY` — your Flutterwave secret key from the Flutterwave dashboard (Settings → API Keys)

### Database Changes
- Add `payment_reference` (text, nullable) column to `orders` table
- Change default order status from `'confirmed'` to `'pending'`

### New Edge Functions

**1. `supabase/functions/flutterwave-init/index.ts`**
- Accepts: order ID, amount, customer email/name/phone, redirect URL
- Validates the authenticated user owns the order
- Calls Flutterwave's `/v3/payments` API to initialize a payment
- Returns the hosted payment link to the frontend

**2. `supabase/functions/flutterwave-webhook/index.ts`**
- Receives Flutterwave webhook callbacks
- Verifies the transaction by calling Flutterwave's `/v3/transactions/:id/verify`
- On success: updates the order status from `pending` to `confirmed`
- On failure: updates the order status to `failed`
- `verify_jwt = false` in config.toml (webhooks are unauthenticated)

### Frontend Changes

**3. `src/pages/Checkout.tsx`**
- On form submit: create order with status `pending`, then call `flutterwave-init` edge function
- Redirect user to the returned Flutterwave payment link (instead of navigating to confirmation)
- Button text changes to "Pay with Flutterwave"

**4. `src/pages/OrderConfirmation.tsx`**
- Read `tx_ref` and `status` from URL query params (Flutterwave redirects back with these)
- Show success or failure state based on the redirect status
- Link to order history

### Technical Details
- Flutterwave API base: `https://api.flutterwave.com`
- Payment init endpoint: `POST /v3/payments`
- Verify endpoint: `GET /v3/transactions/:id/verify`
- Currency: NGN (configurable)
- The `tx_ref` is set to the order ID for easy matching

