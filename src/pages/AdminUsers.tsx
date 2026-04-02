import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logAdminAction } from '@/hooks/useAdminLog';
import AdminNav from '@/components/AdminNav';
import { ShieldAlert, Loader2, Users, Search, X, ChevronLeft, ChevronRight, Trash2, Ban, ShieldCheck } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type UserWithRole = {
  user_id: string;
  email: string;
  created_at: string;
  role: string | null;
  is_banned: boolean;
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
  const [deleteTarget, setDeleteTarget] = useState<UserWithRole | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banTarget, setBanTarget] = useState<UserWithRole | null>(null);
  const [banning, setBanning] = useState(false);
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
        const targetUser = users.find(u => u.user_id === targetUserId);
        toast({ title: 'Role updated', description: `User is now ${newRole}.` });
        setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, role: newRole } : u));
        logAdminAction('role_changed', 'user', targetUserId, { email: targetUser?.email, old_role: targetUser?.role || 'user', new_role: newRole });
      }
    }

    setUpdatingId(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.rpc('delete_user_by_admin', { _target_user_id: deleteTarget.user_id });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User deleted', description: `${deleteTarget.email} has been removed.` });
      setUsers(prev => prev.filter(u => u.user_id !== deleteTarget.user_id));
      logAdminAction('user_deleted', 'user', deleteTarget.user_id, { email: deleteTarget.email, role: deleteTarget.role || 'user' });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleBanToggle = async () => {
    if (!banTarget) return;
    setBanning(true);
    const willBan = !banTarget.is_banned;
    const rpc = willBan ? 'ban_user_by_admin' : 'unban_user_by_admin';
    const { error } = await (supabase.rpc as any)(rpc, { _target_user_id: banTarget.user_id });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: willBan ? 'User suspended' : 'User reactivated', description: `${banTarget.email} has been ${willBan ? 'suspended' : 'reactivated'}.` });
      setUsers(prev => prev.map(u => u.user_id === banTarget.user_id ? { ...u, is_banned: willBan } : u));
      logAdminAction(willBan ? 'user_banned' : 'user_unbanned', 'user', banTarget.user_id, { email: banTarget.email });
    }
    setBanning(false);
    setBanTarget(null);
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
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(u => {
                  const effectiveRole = u.role || 'user';
                  const isSelf = u.user_id === user?.id;

                  return (
                    <tr key={u.user_id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${u.is_banned ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium">
                        {u.email}
                        {u.is_banned && <Badge variant="destructive" className="ml-2 text-[10px] py-0">Suspended</Badge>}
                      </td>
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
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 ${u.is_banned ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-orange-500'}`}
                              onClick={() => setBanTarget(u)}
                              title={u.is_banned ? 'Reactivate user' : 'Suspend user'}
                            >
                              {u.is_banned ? <ShieldCheck size={14} /> : <Ban size={14} />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{deleteTarget?.email}</span> and their profile data. Orders and reviews will be preserved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!banTarget} onOpenChange={(open) => !open && setBanTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{banTarget?.is_banned ? 'Reactivate user?' : 'Suspend user?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {banTarget?.is_banned
                ? <>This will reactivate <span className="font-medium text-foreground">{banTarget?.email}</span>, allowing them to sign in again.</>
                : <>This will suspend <span className="font-medium text-foreground">{banTarget?.email}</span>, preventing them from signing in. Their data will be preserved and you can reactivate them later.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={banning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanToggle}
              disabled={banning}
              className={banTarget?.is_banned ? '' : 'bg-orange-500 text-white hover:bg-orange-600'}
            >
              {banning ? 'Processing…' : banTarget?.is_banned ? 'Reactivate' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
