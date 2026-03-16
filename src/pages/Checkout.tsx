import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
  });

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Link to="/shop" className="text-primary text-sm font-medium">Go to Shop</Link>
      </div>
    );
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    clearCart();
    navigate('/order-confirmation');
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-3 py-2.5 rounded-md border text-sm bg-background text-foreground transition-all duration-150 outline-none ${
      errors[field]
        ? 'border-primary ring-2 ring-primary/20'
        : 'border-input focus:ring-2 focus:ring-ring'
    }`;

  return (
    <div className="container py-10">
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
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{product.name} × {quantity}</span>
                    <span className="font-medium tabular-nums">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary tabular-nums">${totalPrice.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
