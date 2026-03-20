import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AdminNav from '@/components/AdminNav';
import { ShieldAlert, Loader2, Users } from 'lucide-react';
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
        toast({ title: 'Role updated', description: 'User role has been removed.' });
        setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, role: null } : u));
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
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No users found.</p>
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
                {users.map(u => {
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
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
