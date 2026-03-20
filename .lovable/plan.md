

## Plan: Add Change Password Page

### Overview
Create a simple account settings page where logged-in users can change their password using Supabase's `updateUser` API.

### Changes

**1. Create `src/pages/ChangePassword.tsx`**
- Protected page — redirects to `/auth` if not logged in
- Form with current password field (for confirmation UX), new password, and confirm new password fields
- Validates new password matches confirmation and is at least 6 characters
- Calls `supabase.auth.updateUser({ password: newPassword })` on submit
- Shows success/error toast

**2. Update `src/App.tsx`**
- Add route: `<Route path="/account/change-password" element={<ChangePassword />} />`

**3. Update `src/components/Navbar.tsx`**
- Add a "Change Password" link in the logged-in user section (both desktop dropdown area and mobile menu), using a `KeyRound` icon or similar, linking to `/account/change-password`

### No database changes needed
Supabase Auth handles password updates natively via `updateUser`.

