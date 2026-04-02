import { useMemo, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowUpDown, Tag, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

type SortOption = 'biggest-discount' | 'price-asc' | 'price-desc' | 'newest';

const sortLabels: Record<SortOption, string> = {
  'biggest-discount': 'Biggest Discount',
  'price-asc': 'Price: Low → High',
  'price-desc': 'Price: High → Low',
  newest: 'Newest',
};

const Sale = () => {
  const { data: products, isLoading } = useProducts();
  const [sort, setSort] = useState<SortOption>('biggest-discount');

  const saleProducts = useMemo(() => {
    if (!products) return [];
    const onSale = products.filter(
      (p) => p.compare_at_price && p.compare_at_price > p.price
    );

    const sorted = [...onSale];
    switch (sort) {
      case 'biggest-discount':
        sorted.sort((a, b) => {
          const discA = 1 - a.price / (a.compare_at_price || a.price);
          const discB = 1 - b.price / (b.compare_at_price || b.price);
          return discB - discA;
        });
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    return sorted;
  }, [products, sort]);

  const maxDiscount = useMemo(() => {
    if (saleProducts.length === 0) return 0;
    return Math.max(
      ...saleProducts.map((p) =>
        Math.round((1 - p.price / (p.compare_at_price || p.price)) * 100)
      )
    );
  }, [saleProducts]);

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-destructive/90 via-destructive to-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 text-[120px] font-black text-white/20 select-none rotate-[-8deg]">%</div>
          <div className="absolute bottom-2 right-12 text-[80px] font-black text-white/20 select-none rotate-[12deg]">SALE</div>
        </div>
        <div className="container relative py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
            <Tag size={14} />
            Limited Time Deals
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
            Sale & Deals
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-lg mx-auto mb-6">
            {saleProducts.length > 0
              ? `Up to ${maxDiscount}% off on ${saleProducts.length} product${saleProducts.length !== 1 ? 's' : ''}`
              : 'Check back soon for amazing deals'}
          </p>
          {saleProducts.length > 0 && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-destructive font-bold text-lg">
              <Percent size={20} />
              Save up to {maxDiscount}%
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container py-10">
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
        ) : saleProducts.length > 0 ? (
          <>
            {/* Sort */}
            <div className="flex justify-end mb-6">
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {saleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Tag size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No deals right now</h2>
            <p className="text-muted-foreground mb-6">Check back soon — new deals drop regularly!</p>
            <Link
              to="/shop"
              className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sale;
