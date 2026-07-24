import { LogOut, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { track } from '@/lib/analytics';

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, isAnonymous, loading, signInWithGoogle, signOut } = useAuth();

  const handleSignOut = async () => {
    track.authSignoutClicked();
    await signOut();
    navigate('/', { replace: true });
  };

  if (loading || !user) return null;

  const initials = isAnonymous
    ? 'G'
    : (user.email?.[0] ?? 'U').toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-6 h-6 rounded-full bg-studio-accent-subtle border border-studio-accent-border flex items-center justify-center text-[10px] font-bold text-studio-accent hover:bg-studio-accent hover:text-white transition-colors"
          title={isAnonymous ? 'Guest user' : (user.email ?? 'User')}
        >
          {initials}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-52 p-2 bg-studio-panel border-studio-border-strong rounded-studio-lg shadow-studio-lg"
      >
        {/* Identity */}
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[12px] font-medium text-studio-text">
            {isAnonymous ? 'Guest user' : (user.email ?? 'User')}
          </p>
          <p className="text-[10px] text-studio-text-faint mt-0.5">
            {isAnonymous ? 'Sign in for 5 renders/month' : 'Google account'}
          </p>
        </div>

        <div className="h-px bg-studio-border mb-1" />

        {/* Upgrade nudge for anonymous */}
        {isAnonymous && (
          <button
            type="button"
            onClick={() => { track.authUpgradeClicked(); signInWithGoogle(); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-studio-accent hover:bg-studio-accent-subtle rounded-studio-sm transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in with Google
          </button>
        )}

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
