

## Plan: Change Currency from USD to Nigerian Naira (₦)

### Overview
Replace all `$` currency symbols with `₦` across the app. Create a small utility function for consistent formatting.

### Changes

1. **`src/lib/utils.ts`** — Add a `formatPrice` helper:
   ```ts
   export const formatPrice = (amount: number) => `₦${amount.toFixed(2)}`;
   ```

2. **Replace all `${...toFixed(2)}` patterns** in these files:
   - `src/components/ProductCard.tsx` — product price
   - `src/components/Navbar.tsx` — search result price
   - `src/pages/ProductDetail.tsx` — product price
   - `src/pages/Cart.tsx` — item price, subtotal, total
   - `src/pages/Checkout.tsx` — line items, total
   - `src/pages/Orders.tsx` — order total, item prices
   - `src/pages/AdminOrders.tsx` — order total, item prices
   - `src/pages/AdminProducts.tsx` — product price in table

   All instances of `` `$${value.toFixed(2)}` `` become `formatPrice(value)`.

### No database changes needed
Prices are just numbers in the database — only the display symbol changes.

