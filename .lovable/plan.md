

## Plan: Admin Product Management

### Database Changes
Add RLS policies on `products` table for admin INSERT, UPDATE, and DELETE using the existing `has_role` function:
```sql
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
```

### New Page: `src/pages/AdminProducts.tsx`
- Reuse the same admin guard pattern from `AdminOrders.tsx` (auth check + `useIsAdmin`)
- Product list table showing name, category, price, stock, featured status
- "Add Product" button opens a dialog/form with fields: name, category (dropdown: Solar Fans, Shirts, Sneakers, Bags), price, stock_quantity, description, image_url, is_featured (checkbox)
- Each row has Edit and Delete buttons
- Edit opens the same form pre-filled; Delete shows a confirmation dialog
- Uses `supabase.from('products')` for all CRUD, invalidates `products` query cache on changes

### Routing & Navigation
- Add route `/admin/products` in `App.tsx`
- Update `Navbar.tsx`: change admin link to `/admin/orders` but also add navigation tabs within admin pages
- Add simple tab navigation at the top of both admin pages (Orders | Products) so admins can switch between them

### Files to Create/Edit
1. **Migration** -- add admin CRUD policies on products
2. **`src/pages/AdminProducts.tsx`** -- new admin product management page
3. **`src/App.tsx`** -- add route
4. **`src/pages/AdminOrders.tsx`** -- add tab nav linking to Products
5. **`src/components/Navbar.tsx`** -- no changes needed (existing admin link suffices; tabs handle sub-navigation)

