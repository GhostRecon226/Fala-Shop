import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ReviewStats = Record<string, { avg: number; count: number }>;

export const useReviewStats = () => {
  return useQuery<ReviewStats>({
    queryKey: ['review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('product_id, rating');
      if (error) throw error;

      const stats: ReviewStats = {};
      for (const row of data || []) {
        if (!stats[row.product_id]) {
          stats[row.product_id] = { avg: 0, count: 0 };
        }
        stats[row.product_id].count++;
        stats[row.product_id].avg += row.rating;
      }
      for (const id of Object.keys(stats)) {
        stats[id].avg = stats[id].avg / stats[id].count;
      }
      return stats;
    },
    staleTime: 30_000,
  });
};
