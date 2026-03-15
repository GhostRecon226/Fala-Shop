import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderConfirmation = () => {
  return (
    <div className="container py-20 text-center max-w-lg mx-auto">
      <CheckCircle size={64} className="mx-auto text-primary mb-6" />
      <h1 className="text-3xl font-bold tracking-display text-foreground mb-3">Order Confirmed</h1>
      <p className="text-base text-muted-foreground leading-relaxed text-pretty mb-8">
        Thank you for your purchase. We'll send you a confirmation email with your order details and tracking information.
      </p>
      <Link
        to="/shop"
        className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
      >
        Continue Shopping
      </Link>
    </div>
  );
};

export default OrderConfirmation;
