import { useParams, Link } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ArrowLeft, Minus, Plus, Heart } from 'lucide-react';
import { useState } from 'react';
import ProductReviews from '@/components/ProductReviews';
import ProductImageGallery from '@/components/ProductImageGallery';
import { getSizesForCategory, requiresSize, requiresColor, COLOR_SWATCHES } from '@/lib/sizes';
import { useProductImages } from '@/hooks/useProductImages';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || '');
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { data: additionalImages = [] } = useProductImages(id || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const wishlisted = product ? isWishlisted(product.id) : false;

  const needsSize = product ? requiresSize(product.category) : false;

  // Color/size from product or defaults
  const availableSizes = product && (product as any).available_sizes?.length > 0
    ? (product as any).available_sizes as string[]
    : needsSize ? [...getSizesForCategory(product?.category || '')] : [];

  const availableColors = product && (product as any).available_colors?.length > 0
    ? (product as any).available_colors as string[]
    : [];

  const needsColor = availableColors.length > 0;

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
      addItem(product, needsSize ? selectedSize : null, needsColor ? selectedColor : null);
    }
  };

  const canAdd = product.stock_quantity > 0
    && (!needsSize || selectedSize)
    && (!needsColor || selectedColor);

  return (
    <div className="container py-10">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft size={14} /> Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        <ProductImageGallery
          mainImage={product.image_url}
          additionalImages={additionalImages}
          productName={product.name}
        />

        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
            <h1 className="text-3xl font-bold tracking-display text-foreground">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-lg text-muted-foreground line-through tabular-nums">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
            <p className="text-2xl font-bold text-primary tabular-nums">
              {formatPrice(product.price)}
            </p>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
              </span>
            )}
          </div>

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

          {/* Color selector */}
          {needsColor && (
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Select Color</p>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(color => {
                  const swatch = COLOR_SWATCHES[color];
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                        selectedColor === color
                          ? 'border-primary bg-primary/5 text-foreground ring-2 ring-primary/20'
                          : 'border-border text-foreground hover:border-primary/50'
                      }`}
                    >
                      {swatch && (
                        <span
                          className="w-4 h-4 rounded-full border border-border/50 flex-shrink-0"
                          style={{ backgroundColor: swatch }}
                        />
                      )}
                      {color}
                    </button>
                  );
                })}
              </div>
              {!selectedColor && (
                <p className="text-xs text-muted-foreground mt-1.5">Please select a color to continue</p>
              )}
            </div>
          )}

          {/* Size selector */}
          {needsSize && availableSizes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-xs text-muted-foreground mt-1.5">Please select a size to continue</p>
              )}
            </div>
          )}

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
              disabled={!canAdd}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-md text-sm font-semibold transition-all duration-150 hover:opacity-90 disabled:opacity-50"
            >
              {product.stock_quantity === 0
                ? 'Out of Stock'
                : product.category === 'Solar Fans'
                ? 'Equip Now'
                : 'Add to Cart'}
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
