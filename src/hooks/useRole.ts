import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

const RANK: Record<AppRole, number> = {
  super_admin: 4,
  admin: 3,
  moderator: 2,
  user: 1,
};

export const useRole = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<AppRole> => {
      if (!user) return 'user';
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (!data || data.length === 0) return 'user';
      // Pick highest-ranked role
      let best: AppRole = 'user';
      for (const row of data) {
        const r = row.role as AppRole;
        if (RANK[r] > RANK[best]) best = r;
      }
      return best;
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const role = query.data ?? 'user';
  return {
    ...query,
    role,
    isSuperAdmin: role === 'super_admin',
    isAdmin: RANK[role] >= RANK.admin,
    isModerator: RANK[role] >= RANK.moderator,
    hasMinRole: (min: AppRole) => RANK[role] >= RANK[min],
  };
};
