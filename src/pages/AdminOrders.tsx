import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ShieldAlert, Package, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logAdminAction } from '@/hooks/useAdminLog';
import AdminNav from '@/components/AdminNav';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'failed'] as const;

type OrderRow = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: Record<string, string>;
  coupon_code: string | null;
  discount_amount: number;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  size?: string | null;
  product_name?: string;
};

const AdminOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (isAdmin) loadOrders();
  }, [isAdmin]);

  const loadOrders = async () => {
    setLoading(true);
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    const allOrders = (ordersData || []) as OrderRow[];
    setOrders(allOrders);

    if (allOrders.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, price, size')
        .in('order_id', allOrders.map(o => o.id));

      const productIds = [...new Set((items || []).map(i => i.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      const nameMap = Object.fromEntries((products || []).map(p => [p.id, p.name]));
      setOrderItems((items || []).map(i => ({ ...i, product_name: nameMap[i.product_id] })));
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const oldStatus = orders.find(o => o.id === orderId)?.status;
    setUpdatingId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: 'Updated', description: `Order status changed to ${newStatus}` });
      logAdminAction('status_changed', 'order', orderId, { old_status: oldStatus, new_status: newStatus });
    }
    setUpdatingId(null);
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

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert size={24} className="text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
      </div>

      <AdminNav />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <button
          onClick={() => setFilterStatus('all')}
          className={`rounded-lg border p-4 text-left transition-colors ${filterStatus === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
        >
          <p className="text-2xl font-bold text-foreground tabular-nums">{orders.length}</p>
          <p className="text-xs text-muted-foreground">All Orders</p>
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-lg border p-4 text-left transition-colors ${filterStatus === s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
          >
            <p className="text-2xl font-bold text-foreground tabular-nums">{statusCounts[s] || 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const items = orderItems.filter(i => i.order_id === order.id);
            const addr = order.shipping_address || {};
            return (
              <div key={order.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-muted/50">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <p className="font-medium text-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total</span>
                      <p className="font-medium text-foreground tabular-nums">{formatPrice(Number(order.total))}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Customer</span>
                      <p className="font-medium text-foreground text-xs truncate max-w-[180px]">
                        {addr.firstName} {addr.lastName}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <span className="text-muted-foreground">Shipping</span>
                      <p className="font-medium text-foreground text-xs truncate max-w-[220px]">
                        {addr.address}, {addr.city}, {addr.state} {addr.zip}
                      </p>
                    </div>
                  </div>

                  {/* Status selector */}
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      order.status === 'confirmed' || order.status === 'delivered'
                        ? 'bg-green-500/10 text-green-600'
                        : order.status === 'failed'
                        ? 'bg-destructive/10 text-destructive'
                        : order.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-primary/10 text-primary'
                    }`}>{order.status}</span>
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-md border border-border bg-background text-sm font-medium text-foreground capitalize cursor-pointer focus:ring-2 focus:ring-ring outline-none disabled:opacity-50"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="text-foreground">{item.product_name || 'Unknown'}{item.size ? ` (${item.size})` : ''} <span className="text-muted-foreground">× {item.quantity}</span></span>
                      <span className="font-medium text-foreground tabular-nums">{formatPrice(Number(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
