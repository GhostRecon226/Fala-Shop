import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import AdminNav from '@/components/AdminNav';
import { ShieldAlert, Loader2, ScrollText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LogEntry = {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  role_changed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  role_removed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  status_changed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const getActionColor = (action: string) =>
  ACTION_COLORS[action] || 'bg-muted text-muted-foreground';

const formatDetails = (entry: LogEntry): string => {
  const d = entry.details;
  if (!d || Object.keys(d).length === 0) return '';

  const parts: string[] = [];
  if (d.name) parts.push(`"${d.name}"`);
  if (d.email) parts.push(`${d.email}`);
  if (d.old_role !== undefined || d.new_role !== undefined)
    parts.push(`${d.old_role || 'user'} → ${d.new_role || 'user'}`);
  if (d.old_status !== undefined || d.new_status !== undefined)
    parts.push(`${d.old_status} → ${d.new_status}`);
  if (d.price) parts.push(`₦${Number(d.price).toLocaleString()}`);

  return parts.join(' · ');
};

const PER_PAGE = 20;

const AdminActivityLog = () => {
  const { loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const entityTypes = [...new Set(entries.map(e => e.entity_type))].sort();

  const filtered = entityFilter === 'all'
    ? entries
    : entries.filter(e => e.entity_type === entityFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [entityFilter]);

  useEffect(() => {
    if (isAdmin) fetchLog();
  }, [isAdmin]);

  const fetchLog = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error) setEntries((data as LogEntry[]) || []);
    setLoading(false);
  };

  if (authLoading || adminLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive mb-4" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <AdminNav />

      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
        {!loading && (
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} entries
          </span>
        )}
      </div>

      {!loading && entries.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <Filter size={14} className="text-muted-foreground" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {entityTypes.map(t => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <ScrollText className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activity recorded yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Actions will appear here as admins manage the store.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {paginated.map(entry => {
              const details = formatDetails(entry);
              return (
                <div key={entry.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge className={`text-xs shrink-0 ${getActionColor(entry.action)}`}>
                      {entry.action.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm font-medium capitalize shrink-0">{entry.entity_type}</span>
                    {details && (
                      <span className="text-sm text-muted-foreground truncate">{details}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span>{entry.admin_email}</span>
                    <span className="tabular-nums">
                      {new Date(entry.created_at).toLocaleDateString()}{' '}
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminActivityLog;
