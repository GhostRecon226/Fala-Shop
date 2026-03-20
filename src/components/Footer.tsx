import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/50 mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-3">FALA PRODUCTION LTD.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              Engineered utility meets refined style. Solar hardware and lifestyle essentials.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Shop</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shop?category=Solar+Fans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solar Fans</Link>
              <Link to="/shop?category=Clothing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Clothing</Link>
              <Link to="/shop?category=Sneakers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sneakers</Link>
              <Link to="/shop?category=Bags" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Bags</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">About</span>
              <span className="text-sm text-muted-foreground">Contact</span>
              <span className="text-sm text-muted-foreground">Shipping & Returns</span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">© 2026 Fala Production Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
