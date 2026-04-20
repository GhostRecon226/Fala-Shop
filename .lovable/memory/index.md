# Memory: index.md
Updated: just now

---
name: index
description: Project memory index
---
# Project Memory

## Core
E-commerce for Nigerian market. Prices in Naira (₦) with thousand separators.
Primary: Deep Burgundy. Accent: Peach.
Supabase (Auth, DB, Storage) + Edge Functions. Deploy on Vercel (SPA routing).
Flutterwave v3 payments. Auth required for checkout.
Hybrid cart state (localStorage guests, Supabase auth).
Admin RPCs must use SECURITY DEFINER.
4-tier roles: super_admin > admin > moderator > user. super_admin grantable via SQL only.

## Memories
- [Visual Identity](mem://style/visual-identity) — Deep Burgundy/Peach brand colors, logo sizing, tooltips
- [Scope & Market](mem://project/scope-and-market) — Nigerian market targeting, core product categories
- [Architecture](mem://tech/architecture-and-logic) — Supabase, hybrid cart, Edge functions for webhooks
- [Hosting & Routing](mem://tech/hosting-and-routing) — SPA redirects and vercel.json setup
- [Email Infrastructure](mem://tech/email-infrastructure) — Lovable email pipeline, templates, unsubscribes
- [Orders](mem://features/orders) — Status tracking, Flutterwave v3 checkout, cart clearing
- [Product Experience](mem://features/product-experience) — Currency formatting, strict sizing variants
- [Auth & Users](mem://auth/user-configuration) — Checkout auth rules, metadata, password resets
- [Promotional System](mem://features/promotional-system) — Coupon rules, validation RPC, dynamic discounts
- [Pricing & Deals](mem://features/pricing-and-deals) — Compare-at-price strikethrough, discount badges
- [Sale Urgency](mem://features/sale-urgency) — Countdown timer driven by site_settings
- [Admin Management](mem://admin/management-capabilities) — 4-tier role hierarchy, permissions matrix, useRole hook, safety guards
- [Admin User UI](mem://admin/user-management-ui) — super_admin gated, super_admin row protection, role badges
- [Admin Activity Log](mem://admin/activity-log-details) — Audit trail for users, products, and orders
- [Coupon Management](mem://admin/coupon-management) — Coupon CRUD, usage analytics, revenue impact
- [Bulk Product Admin](mem://admin/bulk-product-management) — Bulk pricing and discount updates
- [Site Settings](mem://admin/site-settings) — Global configuration table with public read RLS
- [Customer Tracking](mem://admin/customer-tracking) — Live page-view tracking, journey view, realtime, 90d retention
