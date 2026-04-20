

## Customer page-view tracking for admins

Great idea — this is a real revenue lever. Knowing what a customer is browsing lets you nudge abandoners, recommend bundles, and offer real-time help. Here's a pragmatic plan that respects privacy and stays cheap to run.

### What we'll build

**1. Lightweight page-view logging**
- New table `page_views`: `id, user_id (nullable), session_id, path, page_title, referrer, user_agent, viewed_at, left_at (nullable), duration_seconds (nullable)`.
- A `usePageTracking` hook in `App.tsx` listens to React Router location changes and inserts a row on every navigation (both authenticated users and guests, identified by a stable `session_id` stored in `localStorage`).
- On route change or tab close (`beforeunload`), update the previous row with `left_at` + `duration_seconds` so we know dwell time per page.
- Skip tracking for admin routes (`/admin/*`) to avoid noise.

**2. Active sessions detection (real-time)**
- Add `last_seen_at` column. A heartbeat every 30s while the tab is active updates `last_seen_at`.
- "Active now" = users with `last_seen_at` within last 2 minutes.

**3. Admin "Live Customers" page (`/admin/live`)**
- Tab in `AdminNav` (admin+ role).
- **Top section — Active now**: list of users currently on site with: identifier (email if logged in, else "Guest #abc123"), current page, time on page, total session duration, device. Auto-refreshes every 15s + Supabase realtime subscription on `page_views` inserts.
- **Bottom section — Recent activity**: paginated history of page views (filter by user email, date range, path). Click a row to expand into that visitor's full journey timeline.
- **Per-customer view** (`/admin/live/:userId`): chronological timeline of every page they've visited, with dwell time, plus a "View their cart" / "View their orders" shortcut.

**4. Privacy & retention**
- Add a brief disclosure to the site footer privacy notice: "We track page views to improve service and provide support."
- Auto-delete page_views older than 90 days via a scheduled cleanup (cron-style RPC the user can trigger, or just keep raw and add a manual "purge old data" button in admin).
- Don't log query strings that may contain sensitive data — store path only.

### Permissions
- INSERT on `page_views`: anyone (including anon) — needed for guest tracking.
- SELECT on `page_views`: `has_min_role('admin')` only.
- No UPDATE/DELETE for non-admins (own row updates for `left_at` go through a SECURITY DEFINER RPC that only matches by `session_id`).

### Realtime
- Enable Supabase realtime on `page_views` so the Live Customers page updates instantly as visitors navigate.

### Tradeoffs to be aware of
- **Database writes**: every navigation = 1 insert + 1 update. For a small/medium store this is fine. If traffic explodes later, we can batch via a queue.
- **Guests are anonymous**: we identify them by session_id only — you'll see "Guest #abc123 viewing /shop" but no name/email until they log in. That's by design (privacy + no PII on guests).
- **Not full analytics**: this is for support/sales, not marketing reports. For funnels/cohorts/retention, a tool like PostHog is better. We can add that later if needed.

### Files to create / edit
- Migration: new `page_views` table + RLS + realtime publication + helper RPC for updating `left_at` by session_id.
- New: `src/hooks/usePageTracking.ts`
- New: `src/pages/AdminLiveCustomers.tsx` and `src/pages/AdminCustomerJourney.tsx`
- Edit: `src/App.tsx` (mount tracker), `src/components/AdminNav.tsx` (add tab), `src/pages/Footer.tsx` (privacy note)
- Memory: new `mem://admin/customer-tracking` entry + index update

### Two quick decisions before I build

1. **Guest tracking** — should we track guests (anonymous visitors) too, or only logged-in users? Guest tracking is more useful (most browsers aren't logged in) but raises slightly more privacy considerations.
2. **Retention period** — auto-delete page views after **30 / 60 / 90 days**, or keep forever?

If you have no preference: **track guests** + **90-day retention**.

