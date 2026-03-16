import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Review = {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  user_email?: string;
};

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(star)}
        className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
      >
        <Star
          size={size}
          className={
            star <= value
              ? 'fill-primary text-primary'
              : 'text-border'
          }
        />
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    const loaded = (data || []) as Review[];
    setReviews(loaded);
    if (user) {
      const existing = loaded.find(r => r.user_id === user.id);
      setUserReview(existing || null);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating < 1) return;
    setSubmitting(true);

    const trimmedTitle = title.trim().slice(0, 200);
    const trimmedBody = body.trim().slice(0, 2000);

    if (userReview) {
      await supabase
        .from('reviews')
        .update({ rating, title: trimmedTitle, body: trimmedBody })
        .eq('id', userReview.id);
    } else {
      await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          title: trimmedTitle,
          body: trimmedBody,
        });
    }

    setShowForm(false);
    setTitle('');
    setBody('');
    setRating(5);
    await loadReviews();
    setSubmitting(false);
  };

  const handleEdit = () => {
    if (!userReview) return;
    setRating(userReview.rating);
    setTitle(userReview.title);
    setBody(userReview.body);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!userReview) return;
    await supabase.from('reviews').delete().eq('id', userReview.id);
    setUserReview(null);
    await loadReviews();
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return <div className="mt-12 animate-pulse"><div className="h-6 w-40 bg-muted rounded" /></div>;
  }

  return (
    <div className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={Math.round(avgRating)} readonly size={16} />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} out of 5 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        {user && !showForm && !userReview && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-all"
          >
            Write a Review
          </button>
        )}
        {user && userReview && !showForm && (
          <div className="flex gap-2">
            <button onClick={handleEdit} className="text-sm font-medium text-primary hover:underline">Edit</button>
            <button onClick={handleDelete} className="text-sm font-medium text-destructive hover:underline">Delete</button>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showForm && user && (
        <form onSubmit={handleSubmit} className="border border-border rounded-lg p-5 mb-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rating</label>
            <StarRating value={rating} onChange={setRating} size={24} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Review</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Share your thoughts about this product…"
              className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || rating < 1}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : userReview ? 'Update Review' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setTitle(''); setBody(''); setRating(5); }}
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!user && reviews.length === 0 && (
        <p className="text-sm text-muted-foreground">No reviews yet. <a href="/auth" className="text-primary hover:underline">Sign in</a> to write the first one.</p>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-5">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-border pb-5 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <StarRating value={review.rating} readonly size={14} />
                {review.title && (
                  <span className="text-sm font-semibold text-foreground">{review.title}</span>
                )}
              </div>
              {review.body && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{review.body}</p>
              )}
              <p className="text-xs text-muted-foreground/70">
                {new Date(review.created_at).toLocaleDateString()}
                {review.user_id === user?.id && (
                  <span className="ml-2 text-primary font-medium">Your review</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
