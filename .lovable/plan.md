

## Plan: Add Compare-at-Price (Strikethrough Pricing)

### Overview
Add a `compare_at_price` column to the products table so admins can set an original/old price. When set (and higher than the current price), the old price displays with a strikethrough and the current price shows as the discounted price — across product cards, product detail page, and cart.

### Database Changes

**1. Add `compare_at_price` column to `products` table**
```sql
ALTER TABLE public.products 
ADD COLUMN compare_at_price numeric DEFAULT NULL;
```

### Code Changes

**2. Update `Product` type** (`src/lib/supabase.ts`)
- Add `compare_at_price: number | null`

**3. Update `AdminProducts.tsx`**
- Add `compare_at_price` field to the product form (labeled "Original Price" or "Compare at Price")
- Include it in create/update queries
- Show in the products table

**4. Update `ProductCard.tsx`**
- When `compare_at_price` exists and is greater than `price`, show:
  - Old price with strikethrough styling (`line-through text-muted-foreground`)
  - Current price in bold/primary color
  - Optional discount badge (e.g. "-20%")

**5. Update `ProductDetail.tsx`**
- Same strikethrough treatment in the price section
- Show percentage saved

**6. Update `Cart.tsx`**
- Show strikethrough original price next to discounted price per item

### Visual Example
```text
  ₦15,000  ←  muted, line-through
  ₦12,000  ←  primary, bold
  Save 20%
```

### Technical Notes
- `compare_at_price` is optional — when null or equal to price, only the regular price shows
- No changes to checkout logic needed; the actual `price` field remains the selling price
- Admin can clear the field to remove the strikethrough display

