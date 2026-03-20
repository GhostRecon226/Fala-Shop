import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

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
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-display text-foreground mb-8">Cart</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 p-4 rounded-lg card-shadow">
              <img
                src={product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="w-20 h-20 rounded-md object-cover bg-muted"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/product/${product.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <p className="text-sm font-semibold text-primary tabular-nums mt-1">
                  {formatPrice(product.price)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center border border-border rounded-md">
                  <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1 text-foreground hover:bg-muted transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="px-2 text-xs font-medium tabular-nums">{quantity}</span>
                  <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-1 text-foreground hover:bg-muted transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-[88px] h-fit">
          <div className="p-6 rounded-lg card-shadow space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground text-xs">Calculated at checkout</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-primary tabular-nums">${totalPrice.toFixed(2)}</span>
            </div>
            <Link
              to="/checkout"
              className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
