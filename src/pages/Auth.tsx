import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type View = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);

    if (view === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setResetSent(true);
      }
      setSubmitting(false);
      return;
    }

    if (!password.trim()) { setSubmitting(false); return; }

    const { error } = view === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (view === 'signup') {
      toast({ title: 'Account created!', description: 'You are now signed in.' });
    }

    setSubmitting(false);
  };

  const switchView = (v: View) => {
    setView(v);
    setResetSent(false);
  };

  // Forgot password view
  if (view === 'forgot') {
    return (
      <div className="container flex items-center justify-center py-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-display text-foreground">Reset your password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {resetSent
                ? 'Check your email for a reset link.'
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {!resetSent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2.5 text-sm rounded-md bg-background text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-semibold transition-all duration-150 hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <button onClick={() => switchView('login')} className="font-semibold text-primary hover:opacity-80 transition-opacity">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Login / Signup view
  return (
    <div className="container flex items-center justify-center py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-display text-foreground">
            {view === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {view === 'login' ? 'Sign in to your account' : 'Sign up to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2.5 text-sm rounded-md bg-background text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              {view === 'login' && (
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs text-primary hover:opacity-80 transition-opacity"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3 py-2.5 text-sm rounded-md bg-background text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-semibold transition-all duration-150 hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : view === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {view === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => switchView(view === 'login' ? 'signup' : 'login')}
            className="font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            {view === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
