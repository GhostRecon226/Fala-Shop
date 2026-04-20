---
name: customer-tracking
description: Live customer page-view tracking for admins (page_views table, realtime, journey view)
type: feature
---
- `page_views` table logs every navigation for guests + customers (skips `/admin/*`).
- Identifier: `user_id` if logged in, else stable `session_id` from localStorage (`fp_session_id`).
- 30s heartbeat updates `last_seen_at`. "Active now" = `last_seen_at` within 2 min.
- `usePageTracking` hook mounted in App.tsx inserts on route change, closes prior row with `left_at`+`duration_seconds` via `update_page_view` RPC.
- Admin pages: `/admin/live` (active + recent activity), `/admin/live/:userId` (full journey timeline). Admin+ only.
- Realtime: `page_views` is in `supabase_realtime` publication.
- Retention: `purge_old_page_views(days)` RPC, default 90d. Manual button in UI.
- Privacy disclosure shown in footer.
