import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

const Navbar = () => {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm" style={{ height: '72px' }}>
      <div className="container flex h-full items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-lg font-semibold tracking-display text-foreground">
          FALA PRODUCTION LTD.
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/shop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150">
            Shop
          </Link>
          <Link to="/shop?category=Solar+Fans" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150">
            Solar Fans
          </Link>
          <Link to="/shop?category=Shirts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150">
            Clothing
          </Link>
        </div>

        {/* Utility */}
        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors duration-150">
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tabular-nums text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-background border-b border-border animate-fade-in">
          <div className="container flex flex-col py-4 gap-3">
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-foreground">
              Shop
            </Link>
            <Link to="/shop?category=Solar+Fans" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-foreground">
              Solar Fans
            </Link>
            <Link to="/shop?category=Shirts" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-foreground">
              Clothing
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
