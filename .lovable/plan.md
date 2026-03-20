

## Plan: Add Admin Dashboard Overview Page

### Overview
Create a new dashboard page at `/admin` showing key metrics (total orders, total revenue, product count, recent orders) using data from existing tables. Add it as the first tab in the admin navigation.

### Changes

**1. Create `src/pages/AdminDashboard.tsx`**
- Fetch aggregated data from `orders`, `products` tables
- Display metric cards: Total Orders, Total Revenue (₦), Total Products, Low Stock count
- Show a recent orders list (last 5)
- Optional: simple revenue-over-time bar chart using recharts (already installed)
- Reuse existing admin access guard pattern (useIsAdmin + useAuth)
- Use `AdminNav` for navigation consistency

**2. Update `src/components/AdminNav.tsx`**
- Add "Dashboard" tab at the beginning: `{ label: 'Dashboard', path: '/admin' }`

**3. Update `src/App.tsx`**
- Import `AdminDashboard` and add route: `<Route path="/admin" element={<AdminDashboard />} />`

### No database changes needed
All metrics are derived from existing `orders` and `products` tables using aggregate queries via the client SDK.

