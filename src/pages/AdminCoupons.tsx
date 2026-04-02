import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { logAdminAction } from '@/hooks/useAdminLog';
import AdminNav from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, Plus, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatPrice } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: '',
  discount_type: 'percentage' as string,
  discount_value: '',
  min_order_amount: '',
  max_uses: '',
  expires_at: '',
};

const AdminCoupons = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCoupons(data);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchCoupons(); }, [isAdmin]);

  if (adminLoading || loading) {
    return (
      <div className="container py-10">
        <AdminNav />
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="container py-20 text-center text-muted-foreground">Access Denied</div>;
  }

  const handleCreate = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) { toast.error('Code is required'); return; }
    const discountValue = parseFloat(form.discount_value);
    if (isNaN(discountValue) || discountValue <= 0) { toast.error('Invalid discount value'); return; }
    if (form.discount_type === 'percentage' && discountValue > 100) { toast.error('Percentage cannot exceed 100'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('coupons').insert({
      code,
      discount_type: form.discount_type,
      discount_value: discountValue,
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    });

    if (error) {
      toast.error(error.message.includes('unique') ? 'Code already exists' : error.message);
    } else {
      toast.success('Coupon created');
      logAdminAction('create', 'coupon', code, { discount_type: form.discount_type, discount_value: discountValue });
      setForm(emptyForm);
      setOpen(false);
      fetchCoupons();
    }
    setSubmitting(false);
  };

  const toggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);
    if (!error) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      logAdminAction(coupon.is_active ? 'deactivate' : 'activate', 'coupon', coupon.code);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    const { error } = await supabase.from('coupons').delete().eq('id', coupon.id);
    if (!error) {
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      toast.success('Coupon deleted');
      logAdminAction('delete', 'coupon', coupon.code);
    }
  };

  return (
    <div className="container py-10">
      <AdminNav />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Code</label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                  <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Value</label>
                  <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === 'percentage' ? '10' : '500'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Order Amount</label>
                  <Input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Uses</label>
                  <Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Expires At</label>
                <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                <Button size="sm" onClick={handleCreate} disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No coupons yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Min Order</th>
                <th className="text-left px-4 py-3 font-medium">Usage</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatPrice(c.discount_value)}
                  </td>
                  <td className="px-4 py-3">{c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : '—'}</td>
                  <td className="px-4 py-3">{c.times_used}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteCoupon(c)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
