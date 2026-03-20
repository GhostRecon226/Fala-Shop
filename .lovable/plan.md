

## Plan: Add Size Selection for Clothing Products

### Overview
Add size selection (S, M, L, XL, XXL) on the product detail page for clothing-related categories (Clothing, Sneakers, Bags). Size becomes part of the cart item identity so customers can add the same product in different sizes.

### Changes

**1. Update `CartItem` type and cart logic — `src/contexts/CartContext.tsx`**
- Add optional `size` field to `CartItem` type
- Update `addItem` to accept an optional `size` parameter
- Change cart item matching to use both `product.id` AND `size` (so same product in different sizes = separate cart items)
- Update `removeItem` and `updateQuantity` to use a composite key (`productId + size`)
- Update DB persistence (`cart_items` table needs a `size` column)

**2. Database migration — add `size` column to `cart_items`**
```sql
ALTER TABLE cart_items ADD COLUMN size text DEFAULT NULL;
-- Drop and recreate unique constraint to include size
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_product_id_size_key UNIQUE (user_id, product_id, size);
```

**3. Add `size` column to `order_items`**
```sql
ALTER TABLE order_items ADD COLUMN size text DEFAULT NULL;
```

**4. Size selector on product detail page — `src/pages/ProductDetail.tsx`**
- Add size state and a row of selectable size buttons (S, M, L, XL, XXL) shown only for non-"Solar Fans" categories
- Require size selection before adding to cart (disable button if no size chosen)
- Pass selected size to `addItem`

**5. Display size in cart — `src/pages/Cart.tsx`**
- Show selected size next to category label

**6. Display size in checkout summary — `src/pages/Checkout.tsx`**
- Show size in order line items
- Save size to `order_items` when placing order

**7. Display size in order history — `src/pages/Orders.tsx` and `src/pages/AdminOrders.tsx`**
- Show size next to product name in order item lists

**8. Update `src/lib/supabase.ts`** — no changes needed (Product type unchanged)

### Categories requiring size selection
- Clothing, Sneakers, Bags (everything except Solar Fans)

### Available sizes
S, M, L, XL, XXL

