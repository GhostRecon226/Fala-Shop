import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import heroImage from '@/assets/hero-image.jpg';

const categories = [
  { name: 'Solar Fans', slug: 'Solar+Fans', description: 'Engineered for efficiency' },
  { name: 'Shirts', slug: 'Shirts', description: 'Refined essentials' },
  { name: 'Sneakers', slug: 'Sneakers', description: 'Built to move' },
  { name: 'Bags', slug: 'Bags', description: 'Structured utility' },
];

const Index = () => {
  const { data: featured, isLoading: loadingFeatured } = useFeaturedProducts();
  const { data: allProducts, isLoading: loadingAll } = useProducts();

  const displayProducts = featured && featured.length > 0 ? featured : allProducts?.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="container grid md:grid-cols-2 items-center gap-8 py-16 md:py-24">
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
      <section className="container py-16">
        <h2 className="text-2xl font-bold tracking-display text-foreground mb-8">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
