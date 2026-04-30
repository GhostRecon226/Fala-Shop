# Make Admin Panel Mobile-Friendly

The admin section was built for desktop. On phones, the Add/Edit Product modal still overflows the viewport width, the products table runs off-screen, the action bar wraps awkwardly, and a few other admin pages have similar issues. This plan fixes the entire admin area so it works at standard zoom on mobile.

## What you'll see after the fix

- Add/Edit Product modal fits the screen and scrolls cleanly inside.
- All admin tables (Products, Live Customers, Coupons, Users) scroll horizontally instead of pushing the page wider than the screen.
- Page headers, action buttons, filter chips and the admin tabs wrap nicely on small screens instead of being cut off.
- Bulk action and delete dialogs stay within screen bounds.

## Changes by page

### 1. `AdminProducts.tsx` — Add/Edit Product modal + page

- Modal: change `max-w-md sm:max-w-lg` to a responsive width that respects the viewport on mobile: `w-[calc(100vw-2rem)] max-w-md sm:max-w-lg`. Keep the existing `max-h-[90vh] flex flex-col` and inner scroll wrapper.
- Modal padding: reduce side padding on mobile (`p-4 sm:p-6`) so inputs aren't squeezed.
- Price/Compare-at row: switch `grid-cols-2 gap-4` to `grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4` so the two number fields stack on phones.
- Sizes/Colors chip rows: keep `flex-wrap` but reduce gap on mobile.
- Footer buttons: use `flex-col-reverse sm:flex-row` (already the DialogFooter default) and make Save/Cancel `w-full sm:w-auto` so they're easy to tap.
- Page header row "Products (n)" + Add Product: change `flex items-center justify-between` to `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3` so the action buttons don't get squeezed.
- Products table: wrap the existing `<Table>` in `<div className="overflow-x-auto">` so it scrolls horizontally on phones instead of breaking the layout. Add `min-w-[720px]` on the table.
- Bulk price dialog and Delete dialog: add `w-[calc(100vw-2rem)]` alongside their existing `max-w-sm`.

### 2. `AdminOrders.tsx`

- Status summary cards: already `grid-cols-2 md:grid-cols-5` — keep, but reduce padding on mobile (`p-3 sm:p-4`) so 2-up doesn't feel cramped.
- Order header row inside each card: it currently relies on `flex-wrap` with large gaps; tighten gap on mobile (`gap-3 sm:gap-6`) and make the status select full-width on mobile (`w-full sm:w-auto`).

### 3. `AdminDashboard.tsx`

- Metric cards already responsive (`grid-cols-2 md:grid-cols-4`) — leave as is.
- Sale countdown row already stacks via `flex-col sm:flex-row` — leave as is.
- Revenue chart: shrink left/right padding on mobile so the bars don't get cut by container padding (`p-4 sm:p-5`).
- Recent orders rows: ensure long customer names truncate (`truncate` on the name span).

### 4. `AdminNav.tsx`

- The tab bar is already `overflow-x-auto`, but the active border and tap targets are tight. Add `whitespace-nowrap` to each tab and `scrollbar-hide`-style styling so it scrolls cleanly on mobile.

### 5. Other admin tables

- `AdminLiveCustomers.tsx`: wrap each `<Table>` (3 occurrences) in `<div className="overflow-x-auto">` with `min-w-[600px]` on the table.
- `AdminUsers.tsx` and `AdminCoupons.tsx`: already wrap their tables in `overflow-x-auto` — verify a sensible `min-w-` is set so columns don't squish.

### 6. Container padding

- The shared `container py-10` gives generous side padding on desktop but only ~16px on mobile. Switch admin pages to `container px-4 sm:px-6 py-6 sm:py-10` so there's more vertical breathing room and consistent gutters on phones.

## Out of scope

- No design/visual changes beyond responsive layout (colors, typography, brand styling stay the same).
- No data/RLS changes.
- No new features — this is purely a mobile responsiveness pass.

## Verification

After the changes, I'll open the preview at a 390-wide mobile viewport and walk through:
1. Admin → Products → Add Product (all fields visible, Save reachable).
2. Admin → Products table scrolls horizontally.
3. Admin → Orders (status filter chips + order cards readable).
4. Admin → Dashboard, Live Customers, Coupons, Users, Activity Log.
