

## Plan: Add Forgot Password / Reset Password Flow

### Overview
Add a "Forgot password?" link on the login form, a forgot-password view to request a reset email, and a `/reset-password` page where users set a new password after clicking the email link.

### Changes

**1. Update `src/pages/Auth.tsx`**
- Add a third view state: `'login' | 'signup' | 'forgot'`
- In the `forgot` view, show an email-only form that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Show a success message after submission
- Add a "Forgot password?" link below the password field on the login view

**2. Create `src/pages/ResetPassword.tsx`**
- New page that renders a "Set new password" form (password + confirm password)
- On mount, listen for `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`
- On submit, call `supabase.auth.updateUser({ password })`
- Show success toast and redirect to `/auth` on completion
- Show error state if no recovery session is detected

**3. Update `src/App.tsx`**
- Add route: `<Route path="/reset-password" element={<ResetPassword />} />`

### Technical notes
- The reset email is sent by the built-in auth system (no custom email template needed unless requested separately)
- The `/reset-password` route must be public (not behind auth guard) since the user arrives via email link
- Password confirmation validation happens client-side before calling `updateUser`

