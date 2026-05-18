import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import { useSaleCountdown } from '@/hooks/useSaleCountdown';
import ProductCard from '@/components/ProductCard';
import heroImage from '@/assets/hero-image.jpg';

const categories = [
  { name: 'Solar Fans', slug: 'Solar+Fans', description: 'Engineered for efficiency' },
  { name: 'Clothing', slug: 'Clothing', description: 'Refined essentials' },
  { name: 'Sneakers', slug: 'Sneakers', description: 'Built to move' },
  { name: 'Bags', slug: 'Bags', description: 'Structured utility' },
];

const Index = () => {
  const { data: featured, isLoading: loadingFeatured } = useFeaturedProducts();
  const { data: allProducts, isLoading: loadingAll } = useProducts();
  const { timeLeft } = useSaleCountdown();

  const displayProducts = featured && featured.length > 0 ? featured : allProducts?.slice(0, 4);

  const saleProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts
      .filter(p => p.compare_at_price && p.compare_at_price > p.price)
      .sort((a, b) => {
        const discA = 1 - a.price / (a.compare_at_price || a.price);
        const discB = 1 - b.price / (b.compare_at_price || b.price);
        return discB - discA;
      })
      .slice(0, 4);
  }, [allProducts]);

  const maxDiscount = useMemo(() => {
    if (saleProducts.length === 0) return 0;
    return Math.max(...saleProducts.map(p => Math.round((1 - p.price / (p.compare_at_price || p.price)) * 100)));
  }, [saleProducts]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="container grid md:grid-cols-2 items-center gap-6 md:gap-8 py-10 md:py-24">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-display leading-tight text-foreground">
              Engineered Utility.<br />Refined Style.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed text-pretty max-w-md">
              Solar hardware and lifestyle essentials from Fala Production Ltd. Where technical precision meets everyday design.
            </p>
            <div className="flex gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-semibold transition-all duration-150 hover:opacity-90"
              >
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link
                to="/shop?category=Solar+Fans"
                className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 rounded-md text-sm font-semibold transition-all duration-150 hover:bg-primary hover:text-primary-foreground"
              >
                Explore Solar
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Fala Production products including solar fan, shirt, sneakers, and bag"
              className="w-full rounded-lg card-shadow"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-10 md:py-16">
        <h2 className="text-2xl font-bold tracking-display text-foreground mb-6 md:mb-8">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map(cat => (
            <Link
              key={cat.name}
              to={`/shop?category=${cat.slug}`}
              className="group p-6 rounded-lg bg-secondary card-shadow transition-all duration-150 hover:card-shadow-hover"
            >
              <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
              <ArrowRight size={14} className="mt-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </Link>
          ))}
        </div>
      </section>

      {/* Sale Banner */}
      {saleProducts.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-r from-destructive/90 via-destructive to-primary mb-0">
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-2 left-6 text-[100px] font-black text-white select-none rotate-[-6deg]">%</div>
            <div className="absolute bottom-0 right-8 text-[60px] font-black text-white select-none rotate-[10deg]">SALE</div>
          </div>
          <div className="container relative py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-medium mb-3">
                  <Tag size={12} />
                  Limited Time
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Up to {maxDiscount}% Off
                </h2>
                <p className="text-sm text-white/70 mt-1">Don't miss out on these deals</p>
                {timeLeft && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <Clock size={14} className="text-white/70" />
                    <span className="text-xs text-white/70">Ends in</span>
                    <div className="flex gap-1.5">
                      {timeLeft.days > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded bg-white/20 text-white text-xs font-bold tabular-nums">
                          {timeLeft.days}d
                        </span>
                      )}
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded bg-white/20 text-white text-xs font-bold tabular-nums">
                        {String(timeLeft.hours).padStart(2, '0')}h
                      </span>
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded bg-white/20 text-white text-xs font-bold tabular-nums">
                        {String(timeLeft.minutes).padStart(2, '0')}m
                      </span>
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded bg-white/20 text-white text-xs font-bold tabular-nums">
                        {String(timeLeft.seconds).padStart(2, '0')}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Link
                to="/sale"
                className="inline-flex items-center gap-2 bg-white text-destructive px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-white/90 transition-colors self-start"
              >
                View All Deals <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {saleProducts.map(product => (
                <ProductCard key={product.id} product={product} variant="light" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-display text-foreground">Featured</h2>
          <Link to="/shop" className="text-sm font-medium text-primary hover:text-accent transition-colors">
            View All
          </Link>
        </div>
        {(loadingFeatured || loadingAll) ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-square rounded-lg bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : displayProducts && displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No products yet. Add some through the database.</p>
        )}
      </section>
    </div>
  );
};

export default Index;
