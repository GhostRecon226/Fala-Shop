

## Plan: Add Order Email Notifications on Payment Confirmation

### Overview
Send an order confirmation email to the customer when the Flutterwave webhook confirms a successful payment. This uses Lovable's built-in email system — no third-party service needed.

### Prerequisites (not yet done)
No email domain is configured yet. Before we can send emails, you'll need to set up a sender domain. This is a one-time step where you point a subdomain (e.g., `notify.yourdomain.com`) to Lovable's email infrastructure. It takes a few minutes to configure and up to 72 hours for DNS to fully verify.

### Steps

**1. Set up email domain**
- Open the email setup dialog to configure your sender domain

**2. Set up email infrastructure**
- Automatically provisions the email queue, processing pipeline, and supporting database tables

**3. Scaffold transactional email system**
- Creates the `send-transactional-email` Edge Function and supporting infrastructure (unsubscribe handling, suppression list)

**4. Create order confirmation email template**
- React Email template in `_shared/transactional-email-templates/order-confirmation.tsx`
- Includes order ID, total amount, and a thank-you message
- Styled to match the app's brand (dark plum primary, Inter font, white background)

**5. Create unsubscribe page**
- A simple branded page at the path determined by the scaffold tool

**6. Update the Flutterwave webhook to send the email**
- After updating order status to "confirmed", fetch the order's shipping address (which contains the customer email/name)
- Call `send-transactional-email` with the order confirmation template, passing order details as template data
- Use `order-confirm-{orderId}` as the idempotency key to prevent duplicate sends

**7. Deploy edge functions**
- Deploy `flutterwave-webhook`, `send-transactional-email`, and related functions

### Technical detail
The webhook will add roughly 10 lines: after the successful status update, it queries the order's `shipping_address` JSON for the email/name, then invokes `send-transactional-email` via `supabase.functions.invoke()`. Emails are queued and retried automatically.

