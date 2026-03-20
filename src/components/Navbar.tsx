import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, Menu, X, Search, Heart, User, LogOut, Package, ShieldAlert, KeyRound } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import { useState, useRef, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Product } from '@/lib/supabase';

const Navbar = () => {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: allProducts } = useProducts();

  const results: Product[] = query.trim().length >= 2
    ? (allProducts || []).filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectProduct = (id: string) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/product/${id}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm" style={{ height: '72px' }}>
      <div className="container flex h-full items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Fala Production Ltd." className="h-10 w-auto" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/shop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150">
            Shop
          </Link>
          <Link to="/shop?category=Solar+Fans" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150">
            Solar Fans
          </Link>
          <Link to="/shop?category=Clothing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150">
            Clothing
          </Link>
        </div>

        {/* Utility */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <div className="flex items-center">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); }
                      if (e.key === 'Enter' && results.length > 0) selectProduct(results[0].id);
                    }}
                    placeholder="Search products…"
                    className="w-44 md:w-56 pl-8 pr-3 py-1.5 text-sm rounded-md bg-secondary text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="p-2 text-foreground hover:text-primary transition-colors duration-150"
                      aria-label="Search"
                    >
                      <Search size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Search</TooltipContent>
                </Tooltip>
              )}

              {/* Dropdown results */}
              {searchOpen && query.trim().length >= 2 && (
                <div className="absolute top-full right-0 mt-1 w-72 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  {results.length > 0 ? (
                    results.map(product => (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product.id)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted transition-colors"
                      >
                        <img
                          src={product.image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover bg-muted flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category} · {formatPrice(product.price)}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">No products found</p>
                  )}
                </div>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/wishlist" className="relative p-2 text-foreground hover:text-primary transition-colors duration-150">
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-semibold tabular-nums text-destructive-foreground">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent>Wishlist</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors duration-150">
                  <ShoppingBag size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tabular-nums text-accent-foreground">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent>Cart</TooltipContent>
            </Tooltip>

            {user ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/orders" className="p-2 text-foreground hover:text-primary transition-colors duration-150" aria-label="My orders">
                      <Package size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>My Orders</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/account/change-password" className="p-2 text-foreground hover:text-primary transition-colors duration-150" aria-label="Change password">
                      <KeyRound size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Change Password</TooltipContent>
                </Tooltip>
                {isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/admin/orders" className="p-2 text-foreground hover:text-primary transition-colors duration-150" aria-label="Admin">
                        <ShieldAlert size={20} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Admin</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => signOut()}
                      className="p-2 text-foreground hover:text-primary transition-colors duration-150"
                      aria-label="Sign out"
                    >
                      <LogOut size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Sign Out</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/auth" className="p-2 text-foreground hover:text-primary transition-colors duration-150" aria-label="Sign in">
                    <User size={20} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Sign In</TooltipContent>
              </Tooltip>
            )}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </TooltipProvider>
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
            <Link to="/shop?category=Clothing" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-foreground">
              Clothing
            </Link>
            <div className="border-t border-border my-1" />
            {user ? (
              <>
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-foreground">
                  My Orders
                </Link>
                {isAdmin && (
                  <Link to="/admin/orders" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-primary">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="text-sm font-medium py-2 text-foreground text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-foreground">
                Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
