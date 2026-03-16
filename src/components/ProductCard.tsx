import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Product } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useReviewStats } from '@/hooks/useReviewStats';

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { data: reviewStats } = useReviewStats();
  const wishlisted = isWishlisted(product.id);
  const stats = reviewStats?.[product.id];

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
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary tabular-nums">
            ${product.price.toFixed(2)}
          </p>
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
