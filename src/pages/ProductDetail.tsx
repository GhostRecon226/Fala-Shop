import { useParams, Link } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ArrowLeft, Minus, Plus, Heart } from 'lucide-react';
import { useState } from 'react';
import ProductReviews from '@/components/ProductReviews';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || '');
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const wishlisted = product ? isWishlisted(product.id) : false;

  if (isLoading) {
    return (
      <div className="container py-10 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-lg bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-6 w-1/3 rounded bg-muted" />
            <div className="h-20 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/shop" className="text-primary text-sm mt-4 inline-block">Back to Shop</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  return (
    <div className="container py-10">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft size={14} /> Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-muted card-shadow">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
            <h1 className="text-3xl font-bold tracking-display text-foreground">{product.name}</h1>
          </div>

          <p className="text-2xl font-bold text-primary tabular-nums">
            ${product.price.toFixed(2)}
          </p>

          {product.description && (
            <p className="text-base text-muted-foreground leading-relaxed text-pretty">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {product.stock_quantity} in stock
            </span>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-foreground hover:bg-muted transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="px-4 text-sm font-medium tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                className="p-2 text-foreground hover:bg-muted transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-md text-sm font-semibold transition-all duration-150 hover:opacity-90 disabled:opacity-50"
            >
              {product.stock_quantity === 0
                ? 'Out of Stock'
                : product.category === 'Solar Fans'
                ? 'Equip Now'
                : 'Add to Collection'}
            </button>
            <button
              onClick={() => toggleItem(product)}
              className={`p-3 rounded-md border transition-colors ${
                wishlisted
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/30'
              }`}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={20} className={wishlisted ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </div>
  );
};

export default ProductDetail;
