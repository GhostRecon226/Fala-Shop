import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  created_at: string;
  name: string;
  price: number;
  category: 'Solar Fans' | 'Shirts' | 'Sneakers' | 'Bags';
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
  is_featured: boolean;
};
