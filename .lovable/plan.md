

## Plan: Add Color Selection for Products + Admin Size/Color Management

### Overview
Add a `colors` and `available_sizes` column to the `products` table so admins can specify which colors and sizes are available per product. On the storefront, Clothing products will show a color picker alongside the size selector. The cart will track the selected color.

### Database Migration

Add two new columns to `products`:
- `available_colors text[] DEFAULT '{}'` — array of color names (e.g. `{'Black', 'White', 'Red'}`)
- `available_sizes text[] DEFAULT '{}'` — array of size strings (e.g. `{'S', 'M', 'L'}`)

When these arrays are empty, the app falls back to the current default behavior (all sizes from `sizes.ts`, no color selection).

### Changes

**1. `src/pages/AdminProducts.tsx`**
- Add `available_sizes` and `available_colors` fields to the product form
- For sizes: multi-select checkboxes showing sizes based on category (from `sizes.ts`). Empty = all sizes available.
- For colors: tag-style input where admin types a color name and presses Enter to add it. Each tag is removable. Also show a small color preview swatch for common color names.
- Save both arrays in the product payload

**2. `src/pages/ProductDetail.tsx`**
- Read `available_sizes` and `available_colors` from the product
- If `available_sizes` is non-empty, use it instead of `getSizesForCategory()` defaults
- If `available_colors` is non-empty, show a color selector (pills/buttons like the size selector)
- Require color selection before adding to cart (for categories that have colors defined)
- Pass selected color to `addItem()`

**3. `src/contexts/CartContext.tsx`**
- Add `color?: string | null` to `CartItem`
- Update `addItem`, `removeItem`, `updateQuantity`, `matchItem`, and `itemKey` to include color
- Update cart_items DB sync to include color

**4. Database migration for `cart_items`**
- Add `color text` nullable column to `cart_items`

**5. `src/lib/sizes.ts`**
- Add a default color palette constant: `CLOTHING_COLORS = ['Black', 'White', 'Navy', 'Red', 'Grey', 'Blue', 'Green', 'Brown', 'Beige', 'Pink']`
- Add `requiresColor(category)` helper — returns true for `Clothing`

**6. `src/pages/Cart.tsx`**
- Display selected color alongside size in cart item rows

**7. `src/pages/Checkout.tsx` / `src/pages/Orders.tsx`**
- Include color in order item display where applicable

### Technical Details
- Two columns added to `products` table (text arrays)
- One column added to `cart_items` table (text, nullable)
- Cart matching logic extended to include color dimension
- Admin form gets two new input sections in the product dialog

