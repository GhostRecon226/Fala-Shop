import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import AdminNav from '@/components/AdminNav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type PageView = {
  id: string;
  user_id: string | null;
  session_id: string;
  path: string;
  page_title: string | null;
  referrer: string | null;
  user_agent: string | null;
  viewed_at: string;
  left_at: string | null;
  duration_seconds: number | null;
  last_seen_at: string;
};

const guestLabel = (sid: string) => `Guest #${sid.slice(0, 6)}`;

const deviceFromUA = (ua: string | null) => {
  if (!ua) return 'Unknown';
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'Mobile';
  return 'Desktop';
};

const fmtDuration = (s: number | null | undefined) => {
  if (!s || s < 1) return '—';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
};

const timeAgo = (iso: string) => {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return fmtDuration(diff) + ' ago';
};

const AdminLiveCustomers = () => {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [emails, setEmails] = useState<Record<string, string>>({});

  // Active sessions: last_seen_at within 2 minutes
  const activeQuery = useQuery({
    queryKey: ['live-active'],
    queryFn: async () => {
      const since = new Date(Date.now() - 2 * 60_000).toISOString();
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('last_seen_at', since)
        .order('last_seen_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as PageView[];
    },
    enabled: isAdmin,
    refetchInterval: 15_000,
  });

  // Recent activity
  const recentQuery = useQuery({
    queryKey: ['live-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .order('viewed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as PageView[];
    },
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  // Realtime
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('page-views-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_views' }, () => {
        qc.invalidateQueries({ queryKey: ['live-active'] });
        qc.invalidateQueries({ queryKey: ['live-recent'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, qc]);

  // Latest row per session for "Active now"
  const activeBySession = useMemo(() => {
    const map = new Map<string, PageView>();
    for (const row of activeQuery.data ?? []) {
      const existing = map.get(row.session_id);
      if (!existing || new Date(row.last_seen_at) > new Date(existing.last_seen_at)) {
        map.set(row.session_id, row);
      }
    }
    return Array.from(map.values());
  }, [activeQuery.data]);

  // Resolve emails for user_ids in view
  useEffect(() => {
    const ids = new Set<string>();
    [...(activeQuery.data ?? []), ...(recentQuery.data ?? [])].forEach(r => {
      if (r.user_id && !emails[r.user_id]) ids.add(r.user_id);
    });
    if (ids.size === 0) return;
    (async () => {
      const { data } = await supabase.rpc('list_users_with_roles');
      if (!data) return;
      const next: Record<string, string> = {};
      for (const u of data) next[u.user_id] = u.email;
      setEmails(prev => ({ ...prev, ...next }));
    })();
  }, [activeQuery.data, recentQuery.data]);

  const filterFn = (r: PageView) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const email = r.user_id ? (emails[r.user_id] ?? '').toLowerCase() : '';
    return r.path.toLowerCase().includes(q) || email.includes(q) || r.session_id.toLowerCase().includes(q);
  };

  const handlePurge = async () => {
    if (!confirm('Delete all page views older than 90 days?')) return;
    const { data, error } = await supabase.rpc('purge_old_page_views', { _days: 90 });
    if (error) toast.error(error.message);
    else toast.success(`Deleted ${data ?? 0} old records`);
    qc.invalidateQueries({ queryKey: ['live-recent'] });
  };

  if (roleLoading) return <div className="container py-8">Loading…</div>;
  if (!isAdmin) return <div className="container py-8">Not authorized.</div>;

  return (
    <div className="container py-8">
      <AdminNav />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Live Customers</h1>
          <p className="text-sm text-muted-foreground">Real-time view of who's browsing your store.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePurge}>Purge &gt;90 days</Button>
      </div>

      <AbandonedCartsPanel emails={emails} />

      {/* Active now */}
      <Card className="p-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <h2 className="font-semibold">Active now ({activeBySession.length})</h2>
        </div>
        {activeBySession.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active visitors right now.</p>
        ) : (
          <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Current page</TableHead>
                <TableHead>On page</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Device</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeBySession.map(row => {
                const onPageFor = Math.round((Date.now() - new Date(row.viewed_at).getTime()) / 1000);
                const label = row.user_id ? (emails[row.user_id] ?? 'Customer') : guestLabel(row.session_id);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{label}</div>
                      {row.user_id ? <Badge variant="secondary" className="mt-1">Customer</Badge> : <Badge variant="outline" className="mt-1">Guest</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.path}</TableCell>
                    <TableCell>{fmtDuration(onPageFor)}</TableCell>
                    <TableCell>{timeAgo(row.last_seen_at)}</TableCell>
                    <TableCell>{deviceFromUA(row.user_agent)}</TableCell>
                    <TableCell>
                      <Link to={`/admin/live/${encodeURIComponent(row.user_id ?? `session:${row.session_id}`)}`}>
                        <Button size="sm" variant="ghost">View journey</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </Card>

      {/* Recent activity */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
          <h2 className="font-semibold">Recent activity</h2>
          <Input
            placeholder="Filter by email, path, or session…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
        </div>
        <div className="overflow-x-auto">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recentQuery.data ?? []).filter(filterFn).map(row => {
              const label = row.user_id ? (emails[row.user_id] ?? 'Customer') : guestLabel(row.session_id);
              return (
                <TableRow key={row.id}>
                  <TableCell>{label}</TableCell>
                  <TableCell className="font-mono text-xs">{row.path}</TableCell>
                  <TableCell>{timeAgo(row.viewed_at)}</TableCell>
                  <TableCell>{fmtDuration(row.duration_seconds)}</TableCell>
                  <TableCell>
                    <Link to={`/admin/live/${encodeURIComponent(row.user_id ?? `session:${row.session_id}`)}`}>
                      <Button size="sm" variant="ghost">Journey</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
};

const AbandonedCartsPanel = ({ emails }: { emails: Record<string, string> }) => {
  const [sending, setSending] = useState<Record<string, boolean>>({});

  const abandoned = useQuery({
    queryKey: ['abandoned-carts'],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();

      // Latest page view per logged-in user within last hour
      const { data: pv, error: pvErr } = await supabase
        .from('page_views')
        .select('user_id, path, viewed_at, last_seen_at')
        .not('user_id', 'is', null)
        .gte('viewed_at', oneHourAgo)
        .order('viewed_at', { ascending: false })
        .limit(500);
      if (pvErr) throw pvErr;

      const latestByUser = new Map<string, { path: string; viewed_at: string; last_seen_at: string }>();
      for (const row of pv ?? []) {
        if (!row.user_id) continue;
        if (!latestByUser.has(row.user_id)) {
          latestByUser.set(row.user_id, {
            path: row.path,
            viewed_at: row.viewed_at,
            last_seen_at: row.last_seen_at,
          });
        }
      }

      // Filter to those whose latest path is /cart or /checkout
      const candidateIds: string[] = [];
      latestByUser.forEach((v, uid) => {
        if (v.path === '/cart' || v.path === '/checkout') candidateIds.push(uid);
      });
      if (candidateIds.length === 0) return [];

      // Exclude users who have placed an order in the last hour
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('user_id')
        .gte('created_at', oneHourAgo)
        .in('user_id', candidateIds);
      const ordered = new Set((recentOrders ?? []).map(o => o.user_id));

      const finalIds = candidateIds.filter(id => !ordered.has(id));
      if (finalIds.length === 0) return [];

      // Fetch cart items for each
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('user_id, quantity')
        .in('user_id', finalIds);
      const cartByUser = new Map<string, number>();
      for (const ci of cartItems ?? []) {
        cartByUser.set(ci.user_id, (cartByUser.get(ci.user_id) ?? 0) + (ci.quantity ?? 0));
      }

      return finalIds
        .map(uid => {
          const meta = latestByUser.get(uid)!;
          return {
            user_id: uid,
            path: meta.path,
            last_seen_at: meta.last_seen_at,
            item_count: cartByUser.get(uid) ?? 0,
          };
        })
        .filter(r => r.item_count > 0)
        .sort((a, b) => +new Date(b.last_seen_at) - +new Date(a.last_seen_at));
    },
    refetchInterval: 30_000,
  });

  const sendReminder = async (userId: string, itemCount: number) => {
    const email = emails[userId];
    if (!email) {
      toast.error('Customer email not loaded yet — try again in a moment');
      return;
    }
    setSending(s => ({ ...s, [userId]: true }));
    try {
      const customerName = email.split('@')[0];
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'cart-reminder',
          recipientEmail: email,
          idempotencyKey: `cart-reminder-${userId}-${Math.floor(Date.now() / (60 * 60_000))}`,
          templateData: { customerName, itemCount },
        },
      });
      if (error) throw error;
      toast.success(`Reminder sent to ${email}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send reminder');
    } finally {
      setSending(s => ({ ...s, [userId]: false }));
    }
  };

  const rows = abandoned.data ?? [];

  return (
    <Card className="p-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold">Abandoned carts</h2>
          <p className="text-xs text-muted-foreground">
            Customers whose last page was Cart or Checkout in the past hour, with items still in cart and no recent order.
          </p>
        </div>
        <Badge variant="secondary">{rows.length}</Badge>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No abandoned carts right now.</p>
      ) : (
        <div className="overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Last page</TableHead>
              <TableHead>Items in cart</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => {
              const email = emails[row.user_id] ?? 'Loading…';
              const ago = Math.round((Date.now() - new Date(row.last_seen_at).getTime()) / 60_000);
              return (
                <TableRow key={row.user_id}>
                  <TableCell className="font-medium">{email}</TableCell>
                  <TableCell><code className="text-xs">{row.path}</code></TableCell>
                  <TableCell>{row.item_count}</TableCell>
                  <TableCell>{ago < 1 ? 'just now' : `${ago}m ago`}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => sendReminder(row.user_id, row.item_count)}
                      disabled={!!sending[row.user_id] || !emails[row.user_id]}
                    >
                      {sending[row.user_id] ? 'Sending…' : 'Send reminder'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      )}
    </Card>
  );
};

export default AdminLiveCustomers;
