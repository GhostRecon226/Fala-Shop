import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowUpDown, Tag } from 'lucide-react';

const categories = ['All', 'Solar Fans', 'Clothing', 'Sneakers', 'Bags'];

type SortOption = 'newest' | 'price-asc' | 'price-desc';

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest',
  'price-asc': 'Price: Low → High',
  'price-desc': 'Price: High → Low',
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';
  const [sort, setSort] = useState<SortOption>('newest');
  const [saleOnly, setSaleOnly] = useState(false);
  const { data: products, isLoading } = useProducts(activeCategory === 'All' ? undefined : activeCategory);

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    let filtered = [...products];
    if (saleOnly) {
      filtered = filtered.filter(p => (p as any).compare_at_price && (p as any).compare_at_price > p.price);
    }
    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, sort, saleOnly]);

  const saleCount = useMemo(() => {
    if (!products) return 0;
    return products.filter(p => (p as any).compare_at_price && (p as any).compare_at_price > p.price).length;
  }, [products]);

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

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
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
          {saleCount > 0 && (
            <button
              onClick={() => setSaleOnly(!saleOnly)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                saleOnly
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              }`}
            >
              <Tag size={14} />
              On Sale ({saleCount})
            </button>
          )}
        </div>

        <div className="relative">
          <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="appearance-none pl-8 pr-8 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground border border-border cursor-pointer transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
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
      ) : sortedProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {saleOnly ? 'No products on sale right now.' : 'No products found in this category.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Shop;
