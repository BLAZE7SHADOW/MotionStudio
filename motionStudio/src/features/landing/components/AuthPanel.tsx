import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User2, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import posthog from 'posthog-js';
import { track } from '@/lib/analytics';

type Mode = 'signin' | 'signup';

function humanizeError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Wrong email or password.';
  if (message.includes('User already registered')) return 'An account with this email already exists. Sign in instead.';
  if (message.includes('Email not confirmed')) return 'Please confirm your email first — check your inbox.';
  if (message.includes('Password should be at least')) return 'Password must be at least 6 characters.';
  if (message.includes('Unable to validate email')) return 'Enter a valid email address.';
  // Was: "enable Anonymous Sign-In in your Supabase dashboard" — a note to the
  // operator, shown to the visitor, naming internal infrastructure.
  if (message.includes('Anonymous sign-ins are disabled')) return 'Guest access is unavailable right now — sign in with Google or email instead.';
  return message;
}

export default function AuthPanel() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // shown after successful sign-up so user knows to check their inbox
  const [confirming, setConfirming] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirming(false);
    posthog.capture('auth_mode_switched', { to: next });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    track.authEmailSubmitted(mode);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password);
        track.authSignupConfirmationSent(email);
        setConfirming(true);
      } else {
        await signInWithEmail(email, password);
        track.authCompleted('email');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(humanizeError((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    setError(null);
    setBusy(true);
    track.authGuestClicked();
    try {
      await signInAsGuest();
      track.authCompleted('guest');
      navigate('/dashboard');
    } catch (err) {
      setError(humanizeError((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  // ── Confirmation sent state ──────────────────────────────────────────────
  if (confirming) {
    return (
      <div className="w-full flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold text-studio-text">Check your inbox</h2>
          <p className="text-[13px] text-studio-text-muted leading-relaxed">
            We sent a confirmation link to <span className="text-studio-text font-medium">{email}</span>.
            Click it to activate your account, then come back here to sign in.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => switchMode('signin')}
          className="h-10 text-[13px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  // ── Main auth panel ──────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-5">

      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold text-studio-text">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-[13px] text-studio-text-muted">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-studio-accent hover:underline font-medium"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Email + password form */}
      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 px-3 rounded-studio-md bg-studio-surface border border-studio-border text-[13px] text-studio-text placeholder:text-studio-text-faint focus:outline-none focus:border-studio-accent transition-colors"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 px-3 rounded-studio-md bg-studio-surface border border-studio-border text-[13px] text-studio-text placeholder:text-studio-text-faint focus:outline-none focus:border-studio-accent transition-colors"
        />

        {error && (
          <p className="text-[12px] text-red-400 leading-snug">{error}</p>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="h-10 text-[13px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-2 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-studio-border" />
        <span className="text-[11px] text-studio-text-faint">or</span>
        <div className="flex-1 h-px bg-studio-border" />
      </div>

      {/* Google */}
      <Button
        type="button"
        onClick={() => { track.authGoogleClicked(); signInWithGoogle(); }}
        disabled={busy}
        className="h-10 text-[13px] font-medium bg-studio-surface hover:bg-studio-surface-hover border border-studio-border-strong text-studio-text rounded-studio-md gap-2 disabled:opacity-60"
      >
        <LogIn className="w-4 h-4 text-studio-accent" />
        Continue with Google
      </Button>

      {/* Guest */}
      <button
        type="button"
        onClick={handleGuest}
        disabled={busy}
        className="flex items-center justify-center gap-2 text-[12px] text-studio-text-faint hover:text-studio-text-muted transition-colors disabled:opacity-50"
      >
        <User2 className="w-3.5 h-3.5" />
        Try as guest · 1 free render, no sign-up
      </button>

      {/* Feature list */}
      <ul className="flex flex-col gap-1.5 pt-1 border-t border-studio-border">
        {[
          'Google / Email → 5 cloud renders/month',
          'Guest → 1 cloud render, no account needed',
          'Browser export always free, unlimited',
        ].map((line) => (
          <li key={line} className="flex items-start gap-2 text-[11px] text-studio-text-faint">
            <span className="text-studio-accent mt-px">✓</span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
