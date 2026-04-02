import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(50),
  lastName: z.string().trim().min(1, 'Required').max(50),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().min(1, 'Required').max(20),
  address: z.string().trim().min(1, 'Required').max(200),
  city: z.string().trim().min(1, 'Required').max(100),
  state: z.string().trim().min(1, 'Required').max(100),
  zip: z.string().trim().min(1, 'Required').max(20),
});

type FormData = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; discount_type: string; discount_value: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/checkout" replace />;
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Link to="/shop" className="text-primary text-sm font-medium">Go to Shop</Link>
      </div>
    );
  }

  const discountAmount = appliedCoupon?.discount_amount ?? 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    const { data, error } = await supabase.rpc('validate_coupon', { _code: code, _order_total: totalPrice });
    setCouponLoading(false);
    if (error) { setCouponError('Failed to validate coupon'); return; }
    const result = data as unknown as { valid: boolean; error?: string; discount_amount?: number; discount_type?: string; discount_value?: number };
    if (!result.valid) { setCouponError(result.error || 'Invalid coupon'); return; }
    setAppliedCoupon({ code, discount_amount: result.discount_amount!, discount_type: result.discount_type!, discount_value: result.discount_value! });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Create order with pending status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: totalPrice,
          shipping_address: result.data,
          status: 'pending',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          items.map(({ product, quantity, size }) => ({
            order_id: order.id,
            product_id: product.id,
            quantity,
            price: product.price,
            size: size || null,
          }))
        );

      if (itemsError) throw itemsError;

      // Initialize Flutterwave payment
      const redirectUrl = `${window.location.origin}/order-confirmation`;
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('flutterwave-init', {
        body: {
          order_id: order.id,
          amount: totalPrice,
          email: result.data.email,
          name: `${result.data.firstName} ${result.data.lastName}`,
          phone: result.data.phone,
          redirect_url: redirectUrl,
        },
      });

      if (paymentError || !paymentData?.payment_link) {
        throw new Error(paymentData?.error || 'Failed to initialize payment');
      }

      // Clear cart and redirect to Flutterwave
      clearCart();
      window.location.href = paymentData.payment_link;
      return;
    } catch (err: any) {
      const message = err?.message || 'Something went wrong. Please try again.';
      toast.error('Payment failed', { description: message });
      console.error('Failed to process order:', err);
      setPaymentFailed(true);
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-3 py-2.5 rounded-md border text-sm bg-background text-foreground transition-all duration-150 outline-none ${
      errors[field]
        ? 'border-primary ring-2 ring-primary/20'
        : 'border-input focus:ring-2 focus:ring-ring'
    }`;

  return (
    <div className="container py-10 relative">
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-foreground">Initializing payment…</p>
        </div>
      )}
      <h1 className="text-3xl font-bold tracking-display text-foreground mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Shipping Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name</label>
                  <input className={inputClass('firstName')} value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} />
                  {errors.firstName && <p className="text-xs text-primary mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name</label>
                  <input className={inputClass('lastName')} value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} />
                  {errors.lastName && <p className="text-xs text-primary mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                  <input type="email" className={inputClass('email')} value={form.email} onChange={e => handleChange('email', e.target.value)} />
                  {errors.email && <p className="text-xs text-primary mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <input className={inputClass('phone')} value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
                  {errors.phone && <p className="text-xs text-primary mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                <input className={inputClass('address')} value={form.address} onChange={e => handleChange('address', e.target.value)} />
                {errors.address && <p className="text-xs text-primary mt-1">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                  <input className={inputClass('city')} value={form.city} onChange={e => handleChange('city', e.target.value)} />
                  {errors.city && <p className="text-xs text-primary mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
                  <input className={inputClass('state')} value={form.state} onChange={e => handleChange('state', e.target.value)} />
                  {errors.state && <p className="text-xs text-primary mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">ZIP Code</label>
                  <input className={inputClass('zip')} value={form.zip} onChange={e => handleChange('zip', e.target.value)} />
                  {errors.zip && <p className="text-xs text-primary mt-1">{errors.zip}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-[88px] h-fit">
            <div className="p-6 rounded-lg card-shadow space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
              <div className="space-y-3">
                {items.map(({ product, quantity, size, color }) => (
                  <div key={`${product.id}::${size || ''}::${color || ''}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">
                      {product.name}{size ? ` (${size})` : ''}{color ? ` · ${color}` : ''} × {quantity}
                    </span>
                    <span className="font-medium tabular-nums">{formatPrice(product.price * quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary tabular-nums">{formatPrice(totalPrice)}</span>
              </div>
              {paymentFailed && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  Payment failed. Your form details have been preserved — try again when you're ready.
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                onClick={() => setPaymentFailed(false)}
                className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {submitting ? 'Redirecting to Payment…' : paymentFailed ? 'Retry Payment' : 'Pay with Flutterwave'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
