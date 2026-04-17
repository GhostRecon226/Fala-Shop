import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRole, type AppRole } from '@/hooks/useRole';

type Tab = { label: string; path: string; minRole: AppRole };

const tabs: Tab[] = [
  { label: 'Dashboard', path: '/admin', minRole: 'moderator' },
  { label: 'Orders', path: '/admin/orders', minRole: 'moderator' },
  { label: 'Products', path: '/admin/products', minRole: 'admin' },
  { label: 'Coupons', path: '/admin/coupons', minRole: 'admin' },
  { label: 'Activity Log', path: '/admin/activity', minRole: 'admin' },
  { label: 'Users', path: '/admin/users', minRole: 'super_admin' },
];

const AdminNav = () => {
  const { pathname } = useLocation();
  const { hasMinRole } = useRole();
  const visibleTabs = tabs.filter(t => hasMinRole(t.minRole));

  return (
    <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto">
      {visibleTabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            pathname === tab.path
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export default AdminNav;
