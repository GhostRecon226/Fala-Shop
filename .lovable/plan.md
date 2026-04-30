
## Why uploads are failing

The product image upload writes to the `product-images` storage bucket. The bucket's INSERT/UPDATE/DELETE policies all check:

```
has_role(auth.uid(), 'admin')
```

This is an **exact** role match. Your account is `super_admin`, not `admin`, so the check returns false and Postgres blocks the upload with `new row violates row-level security policy`.

Every other table in the app (products, product_images, coupons, etc.) correctly uses `has_min_role(..., 'admin')`, which treats the role hierarchy properly (`super_admin` ≥ `admin`). The storage bucket policies were never updated to match.

## Fix

A single migration that drops the three storage policies on `product-images` and recreates them using `has_min_role`:

- `Admins can upload product images` (INSERT) — use `has_min_role(auth.uid(), 'admin')`
- `Admins can update product images` (UPDATE) — same
- `Admins can delete product images` (DELETE) — same

The public SELECT policy stays as-is (anyone can view product images).

No app code changes needed — `AdminProductImages.tsx` already calls `supabase.storage.from('product-images').upload(...)` correctly.

## After the fix

You'll be able to upload product images again. Both `super_admin` and `admin` roles will work; `moderator` and `user` will still be blocked.
