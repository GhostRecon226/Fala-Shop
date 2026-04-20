import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import AdminNav from '@/components/AdminNav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PageView = {
  id: string;
  user_id: string | null;
  session_id: string;
  path: string;
  page_title: string | null;
  viewed_at: string;
  left_at: string | null;
  duration_seconds: number | null;
  user_agent: string | null;
};

const fmtDuration = (s: number | null | undefined) => {
  if (!s || s < 1) return '—';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
};

const AdminCustomerJourney = () => {
  const { userId = '' } = useParams();
  const { isAdmin, isLoading } = useRole();
  const [email, setEmail] = useState<string | null>(null);

  const decoded = decodeURIComponent(userId);
  const isSession = decoded.startsWith('session:');
  const sessionId = isSession ? decoded.slice('session:'.length) : null;
  const realUserId = isSession ? null : decoded;

  const journey = useQuery({
    queryKey: ['journey', decoded],
    queryFn: async () => {
      let q = supabase.from('page_views').select('*').order('viewed_at', { ascending: false }).limit(500);
      if (realUserId) q = q.eq('user_id', realUserId);
      else if (sessionId) q = q.eq('session_id', sessionId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PageView[];
    },
    enabled: isAdmin,
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (!realUserId) return;
    (async () => {
      const { data } = await supabase.rpc('list_users_with_roles');
      const found = data?.find(u => u.user_id === realUserId);
      if (found) setEmail(found.email);
    })();
  }, [realUserId]);

  if (isLoading) return <div className="container py-8">Loading…</div>;
  if (!isAdmin) return <div className="container py-8">Not authorized.</div>;

  const heading = realUserId ? (email ?? 'Customer') : `Guest #${sessionId?.slice(0, 6) ?? ''}`;

  return (
    <div className="container py-8">
      <AdminNav />

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link to="/admin/live" className="text-sm text-muted-foreground hover:text-foreground">← Back to Live Customers</Link>
          <h1 className="text-2xl font-bold mt-1">{heading}</h1>
          <div className="flex gap-2 mt-2">
            {realUserId ? <Badge variant="secondary">Customer</Badge> : <Badge variant="outline">Guest session</Badge>}
            <Badge variant="outline">{journey.data?.length ?? 0} page views</Badge>
          </div>
        </div>
        {realUserId && (
          <div className="flex gap-2">
            <Link to="/admin/orders"><Button variant="outline" size="sm">View orders</Button></Link>
          </div>
        )}
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Page journey</h2>
        {journey.data && journey.data.length > 0 ? (
          <ol className="relative border-l border-border ml-2 space-y-4">
            {journey.data.map(row => (
              <li key={row.id} className="ml-4">
                <div className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="font-mono text-sm">{row.path}</div>
                  <div className="text-xs text-muted-foreground">{new Date(row.viewed_at).toLocaleString()}</div>
                </div>
                {row.page_title && <div className="text-sm text-muted-foreground">{row.page_title}</div>}
                <div className="text-xs text-muted-foreground mt-1">Time on page: {fmtDuration(row.duration_seconds)}</div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No page views recorded.</p>
        )}
      </Card>
    </div>
  );
};

export default AdminCustomerJourney;
