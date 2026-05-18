## Plan

Remove sizing from the Bags category so bag products no longer show a size selector on the storefront or in the admin product form.

### Change
- In `src/lib/sizes.ts`, remove `'Bags'` from the `SIZE_CATEGORIES` array (keep it in `COLOR_CATEGORIES` so bags still support color selection).

This single source-of-truth change automatically:
- Hides the "Select Size" block on the Product Detail page for bags.
- Hides the sizes section in the Admin Add/Edit Product modal when category is Bags.
- Allows bags to be added to cart without selecting a size.

### Optional cleanup
Existing bag products in the database may already have `available_sizes` stored from before. Since the UI will no longer surface them, they are harmless. No migration is needed unless you want me to also clear those legacy values — let me know and I'll add a one-time SQL update.