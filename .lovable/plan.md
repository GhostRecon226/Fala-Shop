
## Plan: Add Coupon / Discount Code Feature

### Overview
Create a coupon system where admins can create discount codes, and customers can apply them at checkout to get a percentage or fixed-amount discount on their order total.

### Database Changes

**1. New `coupons` table**
```sql
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percentage', -- 'percentage' or 'fixed'
  discount_value numeric not null,
  min_order_amount numeric default 0,
  max_uses integer default null,         -- null = unlimited
  times_used integer not null default 0,
  is_active boolean not null default true,
  expires_at timestamp with time zone default null,
  created_at timestamp with time zone not null default now()
);
```

- RLS: Admins can CRUD; authenticated users can SELECT active, non-expired coupons (for validation).

**2. New `validate_coupon` RPC function**
- Takes a coupon code and order total
- Checks: exists, active, not expired, not exceeded max uses, meets minimum order amount
- Returns discount type, value, and calculated discount amount
- `SECURITY DEFINER` to bypass RLS for accurate `times_used` checks

**3. Add `coupon_code` and `discount_amount` columns to `orders` table**
- Track which coupon was used and the discount applied per order

**4. New `increment_coupon_usage` trigger**
- On order insert with a `coupon_code`, increment `times_used` on the coupon

### Frontend Changes

**5. Update `src/pages/Checkout.tsx`**
- Add a coupon input field with "Apply" button in the Order Summary section
- On apply: call `validate_coupon` RPC, display discount line item and updated total
- On remove: clear the applied coupon
- Pass `coupon_code` and `discount_amount` when creating the order
- Send discounted total to Flutterwave payment initialization

**6. Update `src/pages/Cart.tsx`**
- Optionally show a "Have a coupon?" teaser linking to checkout

**7. Add admin coupon management page (`src/pages/AdminCoupons.tsx`)**
- List all coupons with code, type, value, usage count, status, expiry
- Create new coupon form (code, discount type, value, min order, max uses, expiry)
- Toggle active/inactive
- Delete coupon

**8. Update `src/App.tsx`**
- Add `/admin/coupons` route
- Update `AdminNav.tsx` to include Coupons link

### Technical Notes
- Coupon codes stored uppercase, validated case-insensitively
- Discount capped so order total never goes below zero
- For percentage discounts, value is 1-100 (representing %)
- The `validate_coupon` function prevents race conditions on usage limits
- Order history will show the coupon code and discount amount applied
