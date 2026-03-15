import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';

const categories = ['All', 'Solar Fans', 'Shirts', 'Sneakers', 'Bags'];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';
  const { data: products, isLoading } = useProducts(activeCategory === 'All' ? undefined : activeCategory);

  const handleCategoryChange = (cat: string) => {
    if (cat === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-display text-foreground mb-2">Shop</h1>
      <p className="text-sm text-muted-foreground mb-8">Browse our complete collection.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-square rounded-lg bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default Shop;
