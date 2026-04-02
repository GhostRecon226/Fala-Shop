import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { formatPrice } from '@/lib/utils';
import AdminNav from '@/components/AdminNav';
import { ShieldAlert, DollarSign, Package, ShoppingCart, AlertTriangle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type Metrics = {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStock: number;
};

type RecentOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: Record<string, string>;
};

type ChartPoint = { date: string; revenue: number };
type LowStockProduct = { id: string; name: string; stock_quantity: number };

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [metrics, setMetrics] = useState<Metrics>({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleEndsAt, setSaleEndsAt] = useState('');
  const [savingSale, setSavingSale] = useState(false);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);

    const [ordersRes, productsRes, settingsRes] = await Promise.all([
      supabase.from('orders').select('id, total, status, created_at, shipping_address').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, stock_quantity'),
      supabase.from('site_settings').select('sale_ends_at').eq('id', 1).single(),
    ]);

    const orders = (ordersRes.data || []) as RecentOrder[];
    const products = productsRes.data || [];

    // Sale end date
    const saleEnd = settingsRes.data?.sale_ends_at;
    if (saleEnd) {
      // Format to datetime-local input value
      setSaleEndsAt(new Date(saleEnd).toISOString().slice(0, 16));
    }

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const lowItems = products
      .filter(p => (p.stock_quantity ?? 0) < 5)
      .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0)) as LowStockProduct[];
    setLowStockProducts(lowItems);

    setMetrics({
      totalOrders: orders.length,
      totalRevenue,
      totalProducts: products.length,
      lowStock: lowItems.length,
    });

    setRecentOrders(orders.slice(0, 5));

    // Build last-30-day revenue chart
    const last30: ChartPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRevenue = orders
        .filter(o => o.created_at.slice(0, 10) === key)
        .reduce((s, o) => s + Number(o.total), 0);
      last30.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: dayRevenue });
    }
    setChartData(last30);
    setLoading(false);
  };

  const handleSaveSaleEnd = async () => {
    setSavingSale(true);
    const value = saleEndsAt ? new Date(saleEndsAt).toISOString() : null;
    const { error } = await supabase
      .from('site_settings' as any)
      .update({ sale_ends_at: value, updated_at: new Date().toISOString() } as any)
      .eq('id', 1);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: value ? 'Sale end date updated' : 'Sale timer cleared' });
    }
    setSavingSale(false);
  };

  if (authLoading || adminLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to access this page.</p>
        <Link to="/auth" className="text-primary text-sm font-medium">Sign In</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-20 text-center">
        <ShieldAlert size={48} className="mx-auto text-destructive mb-4" />
        <p className="text-lg font-semibold text-foreground mb-2">Access Denied</p>
        <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Orders', value: metrics.totalOrders.toString(), icon: ShoppingCart, color: 'text-primary' },
    { label: 'Total Revenue', value: formatPrice(metrics.totalRevenue), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Total Products', value: metrics.totalProducts.toString(), icon: Package, color: 'text-blue-600' },
    { label: 'Low Stock', value: metrics.lowStock.toString(), icon: AlertTriangle, color: metrics.lowStock > 0 ? 'text-destructive' : 'text-muted-foreground' },
  ];

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert size={24} className="text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
      </div>

      <AdminNav />

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading dashboard...</div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {metricCards.map(card => (
              <div key={card.label} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                  <card.icon size={18} className={card.color} />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Sale Timer Setting */}
          <div className="rounded-lg border border-border bg-card p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sale Countdown Timer</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Set when the current sale ends. A countdown timer will appear on the homepage sale banner.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="datetime-local"
                value={saleEndsAt}
                onChange={e => setSaleEndsAt(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSaleEnd} disabled={savingSale}>
                  {savingSale ? 'Saving...' : 'Save'}
                </Button>
                {saleEndsAt && (
                  <Button size="sm" variant="outline" onClick={() => { setSaleEndsAt(''); handleSaveSaleEnd(); }}>
                    Clear Timer
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="rounded-lg border border-border bg-card p-5 mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Revenue — Last 30 Days</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatPrice(value)} labelStyle={{ fontWeight: 600 }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low stock alerts */}
          {lowStockProducts.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 overflow-hidden mb-8">
              <div className="px-5 py-4 border-b border-destructive/20 flex items-center gap-2">
                <AlertTriangle size={16} className="text-destructive" />
                <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">Low Stock Alerts</h2>
              </div>
              <div className="divide-y divide-destructive/10">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className={`font-bold tabular-nums ${p.stock_quantity === 0 ? 'text-destructive' : 'text-amber-600'}`}>
                      {p.stock_quantity === 0 ? 'Out of stock' : `${p.stock_quantity} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-primary font-medium hover:underline">View all</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">No orders yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map(order => {
                  const addr = order.shipping_address || {};
                  return (
                    <div key={order.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{addr.firstName} {addr.lastName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground tabular-nums">{formatPrice(Number(order.total))}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
