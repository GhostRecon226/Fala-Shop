

The user wants a 4-tier role system: **Super Admin → Admin → Moderator → User**. Currently the system has Admin, Moderator (unused placeholder), and User.

## Proposed role hierarchy

| Capability | Super Admin | Admin | Moderator | User |
|---|---|---|---|---|
| Manage users (assign/remove roles, suspend, delete) | ✓ | ✗ | ✗ | ✗ |
| Promote/demote other admins | ✓ | ✗ | ✗ | ✗ |
| Site settings (sale countdown, global config) | ✓ | ✗ | ✗ | ✗ |
| View activity log | ✓ | ✓ | ✗ | ✗ |
| Manage products (create/edit/delete, bulk pricing) | ✓ | ✓ | ✗ | ✗ |
| Manage coupons | ✓ | ✓ | ✗ | ✗ |
| View all orders & update order status | ✓ | ✓ | ✓ | ✗ |
| View contact messages | ✓ | ✓ | ✓ | ✗ |
| Browse, checkout, manage own profile/orders/reviews | ✓ | ✓ | ✓ | ✓ |

**Rationale:** Super Admin is the "owner" — only they touch users, roles, and global settings. Admin handles day-to-day store operations (products, coupons, orders). Moderator is a lightweight support role for handling orders and customer messages without touching the catalog or pricing.

## Implementation plan

### 1. Database migration
- Add `'super_admin'` to the `app_role` enum.
- Seed: promote the current sole admin (you) to `super_admin` so you don't lock yourself out.
- Add helper RPC `has_min_role(_user_id, _role)` that returns true if user has the given role *or higher* (super_admin > admin > moderator > user). Simplifies policies.
- Update RLS policies on:
  - `user_roles`, `site_settings`, `admin_activity_log` (super_admin only for write; admin can read activity log)
  - `products`, `product_images`, `coupons` (admin or higher)
  - `orders`, `order_items` (UPDATE/SELECT all → moderator or higher)
  - `contact_messages` (SELECT → moderator or higher)
- Update SECURITY DEFINER RPCs (`set_user_role`, `remove_user_role`, `delete_user_by_admin`, `ban/unban_user_by_admin`, `log_admin_action`, `list_users_with_roles`) to require `super_admin` for user-management actions, and prevent anyone from assigning `super_admin` via the UI (super_admin can only be granted manually via SQL — safety guard).

### 2. Frontend updates
- **`useIsAdmin`** → split into `useRole()` returning `{ role, isSuperAdmin, isAdmin, isModerator }` plus convenience `useHasMinRole('admin')`.
- **`AdminNav`** → conditionally hide tabs:
  - Users tab → super_admin only
  - Site Settings, Activity Log → super_admin (activity log also visible to admin if you prefer)
  - Products, Coupons → admin+
  - Orders → moderator+
  - Dashboard → all admin roles
- **`AdminUsers`** page → super_admin only; role selector shows `user / moderator / admin` (NOT super_admin — that stays SQL-only).
- **Route guards** on each admin page check the minimum role.
- **`AdminUsers` role badge** → add purple/gold variant for `super_admin`.

### 3. Safety guards
- Migration ensures at least one super_admin exists before applying restrictions.
- `set_user_role` RPC rejects attempts to set role = `super_admin` from the UI.
- Prevent super_admin from demoting themselves (already exists for self-role-change, extend to suspend/delete).

### 4. Memory updates
- Update `mem://admin/management-capabilities` with the new role matrix.
- Update `mem://admin/user-management-ui` to note super_admin gating.

### Files to edit
- New migration (enum + RLS + RPCs)
- `src/hooks/useIsAdmin.ts` (extend or add `useRole.ts`)
- `src/components/AdminNav.tsx`
- `src/pages/AdminUsers.tsx`, `AdminProducts.tsx`, `AdminCoupons.tsx`, `AdminOrders.tsx`, `AdminActivityLog.tsx`, `AdminDashboard.tsx` (role guards)
- Memory files

### Question before I build
Two small decisions — please pick:

1. **Activity log access:** super_admin only, or admin can also view it?
2. **Contact messages:** should moderators see them, or admin+ only?

If you have no preference, I'll go with: activity log = super_admin only, contact messages = moderator+.

