import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const txRef = searchParams.get('tx_ref');

  const isCancelled = status === 'cancelled';
  const isFailed = status === 'failed';
  const isSuccess = !isCancelled && !isFailed;

  return (
    <div className="container py-20 text-center max-w-lg mx-auto">
      {isSuccess && (
        <>
          <CheckCircle size={64} className="mx-auto text-green-600 mb-6" />
          <h1 className="text-3xl font-bold tracking-display text-foreground mb-3">Payment Received</h1>
          <p className="text-base text-muted-foreground leading-relaxed text-pretty mb-2">
            Thank you for your purchase! Your payment is being verified and your order will be confirmed shortly.
          </p>
          {txRef && (
            <p className="text-sm text-muted-foreground mb-8">
              Order reference: <span className="font-medium tabular-nums">{txRef}</span>
            </p>
          )}
        </>
      )}

      {isCancelled && (
        <>
          <Clock size={64} className="mx-auto text-amber-500 mb-6" />
          <h1 className="text-3xl font-bold tracking-display text-foreground mb-3">Payment Cancelled</h1>
          <p className="text-base text-muted-foreground leading-relaxed text-pretty mb-8">
            Your payment was cancelled. Your order is still pending — you can try again from your order history.
          </p>
        </>
      )}

      {isFailed && (
        <>
          <XCircle size={64} className="mx-auto text-destructive mb-6" />
          <h1 className="text-3xl font-bold tracking-display text-foreground mb-3">Payment Failed</h1>
          <p className="text-base text-muted-foreground leading-relaxed text-pretty mb-8">
            Something went wrong with your payment. Please try again or contact support.
          </p>
        </>
      )}

      <div className="flex items-center justify-center gap-4">
        <Link
          to="/orders"
          className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-all"
        >
          View Orders
        </Link>
        <Link
          to="/shop"
          className="inline-flex border border-border text-foreground px-6 py-3 rounded-md text-sm font-semibold hover:bg-muted transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
