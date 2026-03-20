

## Plan: Use Numeric Sizes for Sneakers

### Overview
Sneakers should display numeric sizes (38–46) while Clothing and Bags keep letter sizes (S, M, L, XL, XXL).

### Changes

**`src/lib/sizes.ts`**
- Add a separate `SNEAKER_SIZES` array: `['38', '39', '40', '41', '42', '43', '44', '45', '46']`
- Add a helper function `getSizesForCategory(category: string)` that returns `SNEAKER_SIZES` for "Sneakers" and `SIZES` for other size-requiring categories

**`src/pages/ProductDetail.tsx`**
- Replace `SIZES` import with `getSizesForCategory`
- Use `getSizesForCategory(product.category)` instead of the static `SIZES` array in the size selector

No database or other file changes needed — sizes are stored as text strings, so numeric strings like "42" work as-is.

