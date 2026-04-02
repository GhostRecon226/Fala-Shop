import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { logAdminAction } from '@/hooks/useAdminLog';
import AdminNav from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, Plus, Pencil } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  applies_to: string;
  product_ids: string[];
  categories: string[];
}

interface Product { id: string; name: string; category: string; }

const emptyForm = {
  code: '',
  discount_type: 'percentage' as string,
  discount_value: '',
  min_order_amount: '',
  max_uses: '',
  expires_at: '',
  applies_to: 'all' as string,
  product_ids: [] as string[],
  categories: [] as string[],
};

const AdminCoupons = () => {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [couponsRes, productsRes] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, category').order('name'),
    ]);
    if (couponsRes.data) setCoupons(couponsRes.data as unknown as Coupon[]);
    if (productsRes.data) {
      setProducts(productsRes.data);
      const cats = [...new Set(productsRes.data.map(p => p.category))].sort();
      setAllCategories(cats);
    }
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin]);

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

  const validateForm = () => {
    const code = form.code.trim().toUpperCase();
    if (!code) { toast.error('Code is required'); return null; }
    const discountValue = parseFloat(form.discount_value);
    if (isNaN(discountValue) || discountValue <= 0) { toast.error('Invalid discount value'); return null; }
    if (form.discount_type === 'percentage' && discountValue > 100) { toast.error('Percentage cannot exceed 100'); return null; }
    if (form.applies_to === 'product' && form.product_ids.length === 0) { toast.error('Select at least one product'); return null; }
    if (form.applies_to === 'category' && form.categories.length === 0) { toast.error('Select at least one category'); return null; }
    return {
      code,
      discount_type: form.discount_type,
      discount_value: discountValue,
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      applies_to: form.applies_to,
      product_ids: form.applies_to === 'product' ? form.product_ids : [],
      categories: form.applies_to === 'category' ? form.categories : [],
    };
  };

  const handleSave = async () => {
    const data = validateForm();
    if (!data) return;
    setSubmitting(true);

    if (editingId) {
      const { error } = await supabase.from('coupons').update(data).eq('id', editingId);
      if (error) {
        toast.error(error.message.includes('unique') ? 'Code already exists' : error.message);
      } else {
        toast.success('Coupon updated');
        logAdminAction('update', 'coupon', data.code, { discount_type: data.discount_type, discount_value: data.discount_value, applies_to: data.applies_to });
        closeDialog();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('coupons').insert(data);
      if (error) {
        toast.error(error.message.includes('unique') ? 'Code already exists' : error.message);
      } else {
        toast.success('Coupon created');
        logAdminAction('create', 'coupon', data.code, { discount_type: data.discount_type, discount_value: data.discount_value, applies_to: data.applies_to });
        closeDialog();
        fetchData();
      }
    }
    setSubmitting(false);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : '',
      max_uses: c.max_uses ? String(c.max_uses) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
      applies_to: c.applies_to,
      product_ids: c.product_ids || [],
      categories: c.categories || [],
    });
    setOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
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

  const toggleProductId = (id: string) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id) ? f.product_ids.filter(p => p !== id) : [...f.product_ids, id],
    }));
  };

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat],
    }));
  };

  const scopeLabel = (c: Coupon) => {
    if (c.applies_to === 'product') return `${c.product_ids.length} product(s)`;
    if (c.applies_to === 'category') return c.categories.join(', ');
    return 'All';
  };

  return (
    <div className="container py-10">
      <AdminNav />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Coupon</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
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

              {/* Scope */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Applies To</label>
                <Select value={form.applies_to} onValueChange={v => setForm(f => ({ ...f, applies_to: v, product_ids: [], categories: [] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="product">Specific Products</SelectItem>
                    <SelectItem value="category">Specific Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.applies_to === 'product' && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                      <Checkbox checked={form.product_ids.includes(p.id)} onCheckedChange={() => toggleProductId(p.id)} />
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{p.category}</span>
                    </label>
                  ))}
                </div>
              )}

              {form.applies_to === 'category' && (
                <div className="flex flex-wrap gap-2">
                  {allCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-1.5 text-sm cursor-pointer border border-border rounded-md px-3 py-1.5 hover:bg-muted/50">
                      <Checkbox checked={form.categories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                      {cat}
                    </label>
                  ))}
                </div>
              )}

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
                <Button size="sm" onClick={handleSave} disabled={submitting}>
                  {submitting ? (editingId ? 'Saving…' : 'Creating…') : (editingId ? 'Save Changes' : 'Create')}
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
                <th className="text-left px-4 py-3 font-medium">Scope</th>
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
                  <td className="px-4 py-3">
                    <Badge variant={c.applies_to === 'all' ? 'secondary' : 'outline'} className="text-xs">
                      {scopeLabel(c)}
                    </Badge>
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
