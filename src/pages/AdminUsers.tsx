import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logAdminAction } from '@/hooks/useAdminLog';
import AdminNav from '@/components/AdminNav';
import { ShieldAlert, Loader2, Users, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UserWithRole = {
  user_id: string;
  email: string;
  created_at: string;
  role: string | null;
};

const ROLES = ['user', 'moderator', 'admin'] as const;

const roleBadgeVariant = (role: string | null) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'moderator':
      return 'secondary';
    default:
      return 'outline';
  }
};

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filteredUsers = users.filter(u => {
    const matchesSearch = searchQuery.trim().length === 0 ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const effectiveRole = u.role || 'user';
    const matchesRole = roleFilter === 'all' || effectiveRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchQuery, roleFilter]);

  useEffect(() => {
    if (authLoading || adminLoading || !isAdmin) return;
    fetchUsers();
  }, [authLoading, adminLoading, isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_users_with_roles');
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setUsers((data as UserWithRole[]) || []);
    }
    setLoading(false);
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (targetUserId === user?.id) {
      toast({ title: 'Cannot change own role', description: 'You cannot modify your own admin role.', variant: 'destructive' });
      return;
    }

    setUpdatingId(targetUserId);

    if (newRole === 'user') {
      const { error } = await supabase.rpc('remove_user_role', { _target_user_id: targetUserId });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        const targetUser = users.find(u => u.user_id === targetUserId);
        toast({ title: 'Role updated', description: 'User role has been removed.' });
        setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, role: null } : u));
        logAdminAction('role_removed', 'user', targetUserId, { email: targetUser?.email, old_role: targetUser?.role || 'user', new_role: 'user' });
      }
    } else {
      const { error } = await supabase.rpc('set_user_role', {
        _target_user_id: targetUserId,
        _role: newRole as 'admin' | 'moderator',
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Role updated', description: `User is now ${newRole}.` });
        setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, role: newRole } : u));
      }
    }

    setUpdatingId(null);
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
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        {!loading && (
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredUsers.length} of {users.length} users
          </span>
        )}
      </div>

      {!loading && users.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by email…"
              className="pl-8 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-sm">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map(r => (
                <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No users found.</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No users match your search.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Current Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(u => {
                  const effectiveRole = u.role || 'user';
                  const isSelf = u.user_id === user?.id;

                  return (
                    <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{u.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant(u.role)} className="capitalize">
                          {effectiveRole}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">Cannot change own role</span>
                        ) : (
                          <Select
                            value={effectiveRole}
                            onValueChange={(val) => handleRoleChange(u.user_id, val)}
                            disabled={updatingId === u.user_id}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(role => (
                                <SelectItem key={role} value={role} className="capitalize text-xs">
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
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

export default AdminUsers;
