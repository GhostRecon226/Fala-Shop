# Fix Add/Edit Product modal on mobile

## Problem

On mobile, the Add Product modal still cuts off content. Even with `max-h-[90vh]` and an inner scroll area, the body shrinks too much when the on-screen keyboard opens — and the Save/Cancel footer can disappear below the visible area because nothing is pinned.

## Fix

Convert the modal to a **full-screen sheet on mobile** with a pinned header, scrollable body, and pinned footer. On tablet/desktop (≥640px) it stays a centered dialog like before.

### Change 1 — `DialogContent` in `src/pages/AdminProducts.tsx` (Add/Edit dialog)

Replace the className so the modal:
- Fills the screen on mobile (`w-screen h-[100dvh] max-w-none rounded-none`) using `100dvh` so it adapts to the mobile browser chrome and keyboard.
- Reverts to the constrained dialog on `sm:` (`sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-lg`).
- Removes outer padding so header/body/footer manage their own padding (`p-0 gap-0`).
- Uses `flex flex-col` so the body can flex-grow and scroll while header/footer stay pinned.

### Change 2 — `DialogHeader`

Add `px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-border shrink-0` so the title bar is pinned and visually separated.

### Change 3 — Scrollable body wrapper

Change the inner `space-y-4 flex-1 overflow-y-auto pr-1 -mr-1` to `space-y-4 flex-1 overflow-y-auto px-4 sm:px-6 py-4` so padding lives on the scroll container (no horizontal scrollbar artifacts).

### Change 4 — `DialogFooter`

Add `px-4 sm:px-6 py-3 border-t border-border shrink-0 bg-background` so the Cancel/Save buttons stay pinned at the bottom and are always reachable, even when the keyboard is open.

## Result

- Title always visible at the top.
- All form fields (Name, Category, Price, Compare-at, Stock, Image, Gallery, Sizes, Colors, Description, Featured) reachable by scrolling the body.
- Cancel and Save buttons always pinned at the bottom — no need to scroll past everything to submit.
- Desktop behavior unchanged.

## Verification

I'll resize the preview to 390×844 (iPhone 12 mini), open Admin → Products → Add Product, and confirm the header, all fields, and the Save button remain accessible — including with the address bar visible.
