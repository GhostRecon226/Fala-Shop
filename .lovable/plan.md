

## Plan: Require Login Before Checkout

### Overview
Redirect unauthenticated users to the auth page when they attempt to checkout, then return them to checkout after login.

### Changes

1. **`src/pages/Checkout.tsx`**
   - Add auth check at top: if `!user && !loading`, redirect to `/auth?redirect=/checkout`

2. **`src/contexts/AuthContext.tsx`** (or `src/pages/Auth.tsx`)
   - Read `redirect` query param after successful login
   - Navigate to that URL instead of defaulting to `/`

### Technical Details
- No database or RLS changes needed
- Cart persists via localStorage for guests, merges on login, so items won't be lost
- The "Place Order" button's `if (user)` guard in Checkout becomes unnecessary but harmless

