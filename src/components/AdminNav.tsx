import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Products', path: '/admin/products' },
];

const AdminNav = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex gap-1 mb-8 border-b border-border">
      {tabs.map(tab => (
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
