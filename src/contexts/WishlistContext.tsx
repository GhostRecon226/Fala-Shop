import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/supabase';

type WishlistContextType = {
  items: Product[];
  toggleItem: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
  totalItems: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'wishlist';

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggleItem = (product: Product) => {
    setItems(prev =>
      prev.some(i => i.id === product.id)
        ? prev.filter(i => i.id !== product.id)
        : [...prev, product]
    );
  };

  const isWishlisted = (productId: string) => items.some(i => i.id === productId);

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider value={{ items, toggleItem, isWishlisted, clearWishlist, totalItems: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
