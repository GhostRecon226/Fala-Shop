import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
};

export const useProductImages = (productId: string) => {
  return useQuery<ProductImage[]>({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as ProductImage[];
    },
    enabled: !!productId,
  });
};
