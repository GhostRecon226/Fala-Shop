import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; image_url: string | null } | null;
};

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total, status, created_at')
        .order('created_at', { ascending: false });

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('id, order_id, quantity, price, product_id')
        .in('order_id', ordersData.map(o => o.id));

      const productIds = [...new Set((itemsData || []).map(i => i.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds);

      const productMap = Object.fromEntries((productsData || []).map(p => [p.id, p]));

      setOrders(ordersData.map(o => ({
        ...o,
        items: (itemsData || [])
          .filter(i => i.order_id === o.id)
          .map(i => ({ ...i, product: productMap[i.product_id] || null })),
      })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (authLoading || loading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to view your orders.</p>
        <Link to="/auth" className="text-primary text-sm font-medium">Sign In</Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Package size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
        <Link to="/shop" className="text-primary text-sm font-medium">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-display text-foreground mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="border border-border rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-muted/50">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Order placed</span>
                  <p className="font-medium text-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total</span>
                  <p className="font-medium text-foreground tabular-nums">${Number(order.total).toFixed(2)}</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                {order.status}
              </span>
            </div>
            <div className="divide-y divide-border">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <img
                    src={item.product?.image_url || '/placeholder.svg'}
                    alt={item.product?.name || 'Product'}
                    className="h-14 w-14 rounded object-cover bg-muted flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} · ${Number(item.price).toFixed(2)} each</p>
                  </div>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
