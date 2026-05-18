## Goal
In the homepage "Sale" banner (the burgundy gradient section with "Up to X% Off"), give each product card a white background with slightly rounded corners and dark, readable text for name, category, and price. Other sections (Featured, etc.) stay unchanged.

## Changes

### 1. `src/components/ProductCard.tsx`
Add an optional `variant?: 'default' | 'light'` prop.

When `variant === 'light'`:
- Wrap the existing card content in a container with `bg-white rounded-xl p-3 shadow-sm`.
- Override the text classes so they're dark on white:
  - Product name → `text-foreground` (instead of current color)
  - Category label → `text-muted-foreground` but force a dark tone (e.g. `text-neutral-600`)
  - Current price → `text-foreground` (instead of `text-primary` which is burgundy and disappears on white… actually still readable, but we'll switch to `text-foreground` for stronger contrast)
  - Strikethrough compare-at price → `text-neutral-400`
  - "Add to Cart" button text → `text-foreground hover:text-primary`
- Image tile keeps its existing rounded corners; the outer white card just frames it.

Default variant is unchanged so Featured/New Arrivals/etc. look exactly as today.

### 2. `src/pages/Index.tsx`
In the Sale section grid (around line 143–147), pass `variant="light"` to each `<ProductCard>`:
```tsx
<ProductCard key={product.id} product={product} variant="light" />
```

No other section is touched. No business logic changes.

## Out of scope
- Sale page (`/sale`) styling — only the homepage Sales banner was requested.
- Badge, wishlist heart, or image treatment changes.
