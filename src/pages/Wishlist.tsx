import { useWishlist } from '@/contexts/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { items, clearWishlist } = useWishlist();

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-display text-foreground mb-2">Wishlist</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <Heart size={48} className="mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Link
            to="/shop"
            className="inline-block text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Browse products →
          </Link>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
