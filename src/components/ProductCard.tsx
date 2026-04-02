import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { Heart, Star } from 'lucide-react';
import { Product } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useReviewStats } from '@/hooks/useReviewStats';
import { COLOR_SWATCHES } from '@/lib/sizes';

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { data: reviewStats } = useReviewStats();
  const wishlisted = isWishlisted(product.id);
  const stats = reviewStats?.[product.id];

  const colors = product.available_colors || [];
  const sizes = product.available_sizes || [];

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_at_price!) * 100) : 0;

  return (
    <div className="group relative">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted card-shadow transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:card-shadow-hover">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02]"
            loading="lazy"
          />
          {/* Sale badge */}
          {hasDiscount && (
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
              -{discountPct}%
            </span>
          )}
          {/* Stock overlay on hover */}
          <div className="absolute bottom-0 left-0 right-0 bg-accent/90 px-3 py-1.5 translate-y-full transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-0">
            <span className="text-xs font-medium tabular-nums text-accent-foreground">
              {product.stock_quantity} in stock
            </span>
          </div>
        </div>
      </Link>
      {/* Wishlist button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleItem(product); }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          size={16}
          className={wishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-destructive'}
        />
      </button>
      <div className="mt-3 space-y-1">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-foreground leading-tight">{product.name}</h3>
        </Link>
        {stats && (
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground tabular-nums">{stats.avg.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({stats.count})</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{product.category}</p>

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {colors.slice(0, 6).map(color => (
              <span
                key={color}
                title={color}
                className="w-3.5 h-3.5 rounded-full border border-border/60 flex-shrink-0"
                style={{ backgroundColor: COLOR_SWATCHES[color] || '#9CA3AF' }}
              />
            ))}
            {colors.length > 6 && (
              <span className="text-[10px] text-muted-foreground">+{colors.length - 6}</span>
            )}
          </div>
        )}

        {/* Size badges */}
        {sizes.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {sizes.slice(0, 5).map(size => (
              <span
                key={size}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {size}
              </span>
            ))}
            {sizes.length > 5 && (
              <span className="text-[10px] text-muted-foreground">+{sizes.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-muted-foreground line-through tabular-nums">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
            <p className="text-sm font-semibold text-primary tabular-nums">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={() => addItem(product)}
            className="text-xs font-medium text-primary hover:text-accent transition-colors duration-150"
          >
            {product.category === 'Solar Fans' ? 'Equip Now' : 'Add to Collection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
