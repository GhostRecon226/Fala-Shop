

## Plan: Create About, Contact, and Shipping & Returns Pages

### New Pages

**1. `src/pages/About.tsx`** — Simple brand overview
- Company name, tagline, brief description of Fala Production Ltd.
- Product categories and brand values (utility, quality, style)
- Clean layout matching existing page styling

**2. `src/pages/Contact.tsx`** — Contact form + details
- Contact form with name, email, subject, and message fields (validated with zod + react-hook-form)
- Contact details section: email address, phone number
- Form submissions stored in a new `contact_messages` database table
- Toast confirmation on successful submission

**3. `src/pages/ShippingReturns.tsx`** — Accordion FAQ style
- Accordion sections covering: Shipping Rates, Delivery Times, International Shipping, Return Policy, Refund Process, Exchanges
- Uses existing Accordion UI component

### Database Migration
- Create `contact_messages` table: `id`, `name`, `email`, `subject`, `message`, `created_at`
- RLS policy: allow anonymous inserts, admin-only reads

### Routing & Footer Updates

**4. `src/App.tsx`** — Add 3 new routes: `/about`, `/contact`, `/shipping-returns`

**5. `src/components/Footer.tsx`** — Convert the static `<span>` elements to `<Link>` components pointing to the new routes

### Files to create/edit
- Create: `src/pages/About.tsx`, `src/pages/Contact.tsx`, `src/pages/ShippingReturns.tsx`
- Edit: `src/App.tsx`, `src/components/Footer.tsx`
- Database: 1 migration for `contact_messages` table

