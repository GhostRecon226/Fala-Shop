import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Product } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type CartItem = {
  product: Product;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, size?: string | null, color?: string | null) => void;
  removeItem: (productId: string, size?: string | null, color?: string | null) => void;
  updateQuantity: (productId: string, size: string | null | undefined, color: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_KEY = 'cart_items';

const matchItem = (item: CartItem, productId: string, size?: string | null, color?: string | null) =>
  item.product.id === productId && (item.size || null) === (size || null) && (item.color || null) === (color || null);

const readLocal = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocal = (items: CartItem[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const syncing = useRef(false);

  useEffect(() => {
    if (user) {
      loadFromDb();
    } else {
      setItems(readLocal());
      setLoading(false);
    }
  }, [user]);

  const loadFromDb = async () => {
    setLoading(true);
    const { data: cartRows } = await supabase
      .from('cart_items')
      .select('product_id, quantity, size, color');

    if (!cartRows || cartRows.length === 0) {
      const local = readLocal();
      if (local.length > 0) {
        await mergeLocalToDb(local);
        setItems(local);
        localStorage.removeItem(LOCAL_KEY);
      } else {
        setItems([]);
      }
      setLoading(false);
      return;
    }

    const productIds = cartRows.map(r => r.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const productMap = Object.fromEntries((products || []).map(p => [p.id, p]));
    const loaded: CartItem[] = cartRows
      .filter(r => productMap[r.product_id])
      .map(r => ({
        product: productMap[r.product_id] as Product,
        quantity: r.quantity,
        size: r.size || null,
        color: r.color || null,
      }));

    const local = readLocal();
    if (local.length > 0) {
      for (const li of local) {
        const existing = loaded.find(i => matchItem(i, li.product.id, li.size, li.color));
        if (existing) {
          existing.quantity += li.quantity;
        } else {
          loaded.push(li);
        }
      }
      await mergeLocalToDb(loaded);
      localStorage.removeItem(LOCAL_KEY);
    }

    setItems(loaded);
    setLoading(false);
  };

  const mergeLocalToDb = async (cartItems: CartItem[]) => {
    if (!user) return;
    for (const item of cartItems) {
      await supabase
        .from('cart_items')
        .upsert(
          { user_id: user.id, product_id: item.product.id, quantity: item.quantity, size: item.size || null, color: item.color || null },
          { onConflict: 'user_id,product_id,size' }
        );
    }
  };

  const persistItem = useCallback(async (productId: string, quantity: number, size?: string | null, color?: string | null) => {
    if (!user) return;
    if (syncing.current) return;
    syncing.current = true;
    await supabase
      .from('cart_items')
      .upsert(
        { user_id: user.id, product_id: productId, quantity, size: size || null, color: color || null },
        { onConflict: 'user_id,product_id,size' }
      );
    syncing.current = false;
  }, [user]);

  const removeFromDb = useCallback(async (productId: string, size?: string | null, color?: string | null) => {
    if (!user) return;
    let query = supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    if (size) {
      query = query.eq('size', size);
    } else {
      query = query.is('size', null);
    }
    if (color) {
      query = query.eq('color', color);
    } else {
      query = query.is('color', null);
    }
    await query;
  }, [user]);

  const clearDb = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
  }, [user]);

  const addItem = (product: Product, size?: string | null, color?: string | null) => {
    setItems(prev => {
      const existing = prev.find(i => matchItem(i, product.id, size, color));
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(i =>
          matchItem(i, product.id, size, color)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
        persistItem(product.id, existing.quantity + 1, size, color);
      } else {
        updated = [...prev, { product, quantity: 1, size: size || null, color: color || null }];
        persistItem(product.id, 1, size, color);
      }
      if (!user) writeLocal(updated);
      return updated;
    });
  };

  const removeItem = (productId: string, size?: string | null, color?: string | null) => {
    setItems(prev => {
      const updated = prev.filter(i => !matchItem(i, productId, size, color));
      if (!user) writeLocal(updated);
      removeFromDb(productId, size, color);
      return updated;
    });
  };

  const updateQuantity = (productId: string, size: string | null | undefined, color: string | null | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size, color);
      return;
    }
    setItems(prev => {
      const updated = prev.map(i =>
        matchItem(i, productId, size, color) ? { ...i, quantity } : i
      );
      if (!user) writeLocal(updated);
      persistItem(productId, quantity, size, color);
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (!user) localStorage.removeItem(LOCAL_KEY);
    clearDb();
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
