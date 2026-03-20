

## Plan: Auto-refresh Admin Role Detection

### Problem
When an admin assigns a role to a user, that user's `useIsAdmin` React Query result is cached and doesn't update until they log out and back in.

### Solution
Update `src/hooks/useIsAdmin.ts` to enable automatic refetching:
- Set `refetchOnWindowFocus: true` (already default, but be explicit)
- Add `staleTime: 30_000` (30 seconds) so it re-checks periodically
- Add `refetchInterval: 60_000` (poll every 60 seconds in background)

This ensures that within ~60 seconds of a role change, the user's UI updates automatically — no logout required.

### Single file change
**`src/hooks/useIsAdmin.ts`** — add `staleTime`, `refetchInterval`, and `refetchOnWindowFocus` to the query options.

