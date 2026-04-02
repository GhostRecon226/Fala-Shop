import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number } | null;

export function useSaleCountdown() {
  const { data: saleEndsAt } = useQuery({
    queryKey: ['site-settings-sale'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings' as any)
        .select('sale_ends_at')
        .eq('id', 1)
        .single();
      return (data as any)?.sale_ends_at as string | null;
    },
    staleTime: 60_000,
  });

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(null);

  useEffect(() => {
    if (!saleEndsAt) {
      setTimeLeft(null);
      return;
    }

    const target = new Date(saleEndsAt).getTime();

    const calc = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [saleEndsAt]);

  return { timeLeft, saleEndsAt };
}
