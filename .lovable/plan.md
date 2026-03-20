

## Plan: Enable Color Selection for Sneakers and Bags

### Single file change

**`src/lib/sizes.ts`** — Update `COLOR_CATEGORIES` to include `'Sneakers'` and `'Bags'`:

```typescript
const COLOR_CATEGORIES = ['Clothing', 'Sneakers', 'Bags'];
```

This automatically enables:
- Admin color input when uploading Sneakers or Bags
- Color picker on the product detail page for those categories
- Color tracked through cart and checkout

No other changes needed — the existing `requiresColor()` helper and all UI components already use this array.

