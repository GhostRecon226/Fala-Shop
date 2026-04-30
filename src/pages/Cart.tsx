import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Minus, Plus, Trash2, ShoppingBag, Info } from 'lucide-react';


const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground text-sm mb-6">Start shopping to add items to your cart.</p>
        <Link
          to="/shop"
          className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-10 pb-32 lg:pb-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-display text-foreground mb-6 sm:mb-8">Cart</h1>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
        {items.map(({ product, quantity, size, color }) => (
            <div key={`${product.id}::${size || ''}::${color || ''}`} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg card-shadow">
              <img
                src={product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="w-20 h-20 rounded-md object-cover bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/product/${product.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {product.category}{size ? ` · Size ${size}` : ''}{color ? ` · ${color}` : ''}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-xs text-muted-foreground line-through tabular-nums">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-primary tabular-nums">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between shrink-0">
                <button onClick={() => removeItem(product.id, size, color)} className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1" aria-label="Remove item">
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center border border-border rounded-md">
                  <button onClick={() => updateQuantity(product.id, size, color, quantity - 1)} className="p-1.5 text-foreground hover:bg-muted transition-colors" aria-label="Decrease quantity">
                    <Minus size={12} />
                  </button>
                  <span className="px-2 text-xs font-medium tabular-nums">{quantity}</span>
                  <button onClick={() => updateQuantity(product.id, size, color, quantity + 1)} className="p-1.5 text-foreground hover:bg-muted transition-colors" aria-label="Increase quantity">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary — desktop side column */}
        <div className="hidden lg:block lg:sticky lg:top-[88px] h-fit">
          <div className="p-6 rounded-lg card-shadow space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground text-xs">Calculated at checkout</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-primary tabular-nums">{formatPrice(totalPrice)}</span>
            </div>
            {!user && (
              <div className="flex items-start gap-2 rounded-md bg-accent/50 border border-accent px-3 py-2.5 text-xs text-accent-foreground">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <p>You'll need to <Link to="/auth?redirect=/checkout" className="font-semibold underline underline-offset-2 hover:text-primary transition-colors">sign in</Link> before completing your purchase.</p>
              </div>
            )}
            <Link
              to={user ? "/checkout" : "/auth?redirect=/checkout"}
              className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3 space-y-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        {!user && (
          <p className="text-[11px] text-muted-foreground text-center">
            <Link to="/auth?redirect=/checkout" className="font-semibold text-primary underline underline-offset-2">Sign in</Link> required to complete purchase.
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground leading-tight">Total</p>
            <p className="text-base font-bold text-primary tabular-nums leading-tight">{formatPrice(totalPrice)}</p>
          </div>
          <Link
            to={user ? "/checkout" : "/auth?redirect=/checkout"}
            className="flex-1 text-center bg-primary text-primary-foreground py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
