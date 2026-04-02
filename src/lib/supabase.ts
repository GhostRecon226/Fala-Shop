export { supabase } from '@/integrations/supabase/client';

export type Product = {
  id: string;
  created_at: string;
  name: string;
  price: number;
  category: 'Solar Fans' | 'Clothing' | 'Sneakers' | 'Bags';
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
  is_featured: boolean;
  compare_at_price: number | null;
  available_colors: string[];
  available_sizes: string[];
};
