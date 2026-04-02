

## Problem: 404 on Page Refresh (Published Site)

The published site returns a 404 when refreshing any route other than `/` (e.g. `/cart`, `/order-confirmation`). This is a standard single-page application (SPA) issue: the hosting server tries to find a file matching the URL path, fails, and returns 404. The app needs a fallback rewrite rule so all paths serve `index.html`, letting React Router handle routing client-side.

## Fix

**1. Create `public/_redirects` file**

Add a Netlify-compatible catch-all rewrite (Lovable's hosting uses this):

```
/*    /index.html   200
```

This single line ensures every route falls back to the SPA entry point, so refreshing `/cart`, `/order-confirmation?status=success&tx_ref=...`, or any other route works correctly.

This is a one-file, one-line fix.

