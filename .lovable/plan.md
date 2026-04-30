# Fix Add/Edit Product modal overflow

## Problem
On the admin Products page, opening the "Add Product" (or "Edit Product") dialog cuts off the lower half of the form (sizes, colors, description, footer buttons). It only becomes visible when the browser is zoomed to ~50%.

**Cause:** In `src/pages/AdminProducts.tsx` (line 389), the modal uses:
```
<DialogContent className="max-w-md">
```
The base `DialogContent` is fixed-positioned and centered (`top-[50%] translate-y-[-50%]`) with no height cap and no internal scroll. Because the form contains many fields (name, category, price, compare-at-price, stock, cover image upload, gallery uploader, sizes, colors, description, featured toggle, footer), the content grows taller than the viewport, gets pushed off the top and bottom of the screen, and the dialog itself doesn't scroll — so the only way to see everything is to zoom out.

The bulk and delete dialogs are short and unaffected, so the fix is scoped to the Add/Edit dialog.

## Fix
Update only the Add/Edit `DialogContent` so it:
1. Caps its total height to the viewport (with a small margin) — `max-h-[90vh]`
2. Lays out as a flex column so the header/footer stay fixed and only the body scrolls — `flex flex-col`
3. Slightly widens it on larger screens so two-column rows (Price / Compare-at-Price) and the gallery grid breathe — `max-w-md sm:max-w-lg`

Then wrap the existing form `<div className="space-y-4">` (lines 396–580) so it becomes the scrollable region: `flex-1 overflow-y-auto pr-1 -mr-1` (the negative margin keeps the scrollbar from visually clipping inputs).

Header and `DialogFooter` stay outside the scroll region, so Save/Cancel are always reachable.

## Files to change
- `src/pages/AdminProducts.tsx`
  - Line 389: `<DialogContent className="max-w-md">` → `<DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col">`
  - Line 396: `<div className="space-y-4">` → `<div className="space-y-4 flex-1 overflow-y-auto pr-1 -mr-1">`

No changes to the delete dialog, the bulk dialog, the shared `DialogContent` primitive, or any other page.

## Verification
After the change, at the user's current 1225×752 preview:
- The Add Product dialog opens centered, never taller than ~677px.
- The form body scrolls internally; Name through Featured toggle are all reachable.
- The Save / Cancel footer is always visible at the bottom of the dialog.
- Edit Product behaves the same and additionally shows the gallery uploader without pushing the footer off-screen.