import { Link } from 'react-router-dom';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
  </svg>
);

const socials = [
  { label: 'Instagram', href: '#', Icon: Instagram, color: '#E4405F' },
  { label: 'Facebook', href: '#', Icon: Facebook, color: '#1877F2' },
  { label: 'TikTok', href: '#', Icon: TikTokIcon, color: undefined },
  { label: 'LinkedIn', href: '#', Icon: Linkedin, color: '#0A66C3' },
];

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
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              <Link to="/shipping-returns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Shipping & Returns</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">© 2026 Fala Production Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {socials.map(({ label, href, Icon, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                style={color ? { color } : undefined}
                className={`hover:opacity-80 transition-opacity ${color ? '' : 'text-foreground'}`}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
