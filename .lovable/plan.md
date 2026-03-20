

## Plan: Merge Change Password into Account Settings

### Overview
Move the change password form into the Account Settings page as a section below the profile fields, and remove the standalone Change Password page and its navbar icon.

### Changes

**1. Update `src/pages/AccountSettings.tsx`**
- Add a "Change Password" section below the profile form with new password and confirm password fields
- Include the same validation and `supabase.auth.updateUser()` logic from `ChangePassword.tsx`

**2. Update `src/components/Navbar.tsx`**
- Remove the `KeyRound` icon/link to `/account/change-password` from both desktop and mobile menus

**3. Update `src/App.tsx`**
- Remove the `/account/change-password` route and `ChangePassword` import

**4. Delete `src/pages/ChangePassword.tsx`**

