

## Plan: Clear All Dummy Data (Full Clean Slate)

### What will be deleted
| Table | Records | Action |
|-------|---------|--------|
| cart_items | 3 | Delete all |
| order_items | (linked to 13 orders) | Delete all |
| orders | 13 | Delete all |
| reviews | 0 | Delete all (safety) |
| product_images | 0 | Delete all (safety) |
| products | 18 | Delete all |

### Execution order
Deletions must happen in dependency order to avoid referential issues:

1. **Delete cart_items** — references products
2. **Delete order_items** — references orders and products
3. **Delete orders** — references users
4. **Delete reviews** — references products
5. **Delete product_images** — references products
6. **Delete products** — the main target

All six DELETE statements will be executed via the database insert tool (data operations, not schema changes).

### Notes
- No schema changes needed — tables stay intact, just emptied
- Storage bucket `product-images` files (if any) are not auto-deleted by row deletion, but the query showed 0 image records so nothing to clean
- The site will show empty product grids until new products are added

