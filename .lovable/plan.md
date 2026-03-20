

## Plan: Add Tooltips to Navbar Icons

Wrap each icon button/link in the navbar's utility area with the existing `Tooltip` component from `src/components/ui/tooltip.tsx` so hovering displays a label.

### Changes

**`src/components/Navbar.tsx`**
- Import `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip`
- Wrap the utility icons section in `<TooltipProvider>`
- Add tooltips to: Search, Wishlist, Cart, My Orders, Admin, Sign Out, Sign In icons with labels like "Search", "Wishlist", "Cart", "My Orders", "Admin", "Sign Out", "Sign In"

No other files need changes — the tooltip component already exists.

