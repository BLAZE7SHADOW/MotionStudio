import { useState } from 'react';
import { LogOut, LogIn, HelpCircle, MessageSquare, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { track } from '@/lib/analytics';
import { startEditorTour } from '@/features/workspace/tour/useEditorTour';
import FeedbackDialog from './FeedbackDialog';
import WhatsNewDialog from './WhatsNewDialog';
import { hasUnseenRelease, markReleasesSeen } from '@/lib/releaseSeen';

export default function UserMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAnonymous, loading, signInWithGoogle, signOut } = useAuth();
  // This menu is shared with the dashboard, where there's no editor to tour.
  const inEditor = pathname.startsWith('/editor');

  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // One side-effecting call, read once at mount and shared by both pieces of
  // state. hasUnseenRelease() marks a first-ever visit as seen rather than
  // returning true, so a brand-new user is never met with a changelog they have
  // no "before" for. Doing this as a lazy initialiser rather than an effect
  // keeps it to a single call and avoids a second render pass.
  const [initiallyUnseen] = useState(hasUnseenRelease);
  const [unseen, setUnseen] = useState(initiallyUnseen);
  const [whatsNewOpen, setWhatsNewOpen] = useState(initiallyUnseen);

  function closeWhatsNew() {
    setWhatsNewOpen(false);
    markReleasesSeen();
    setUnseen(false);
  }

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
    <>
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative w-6 h-6 rounded-full bg-studio-accent-subtle border border-studio-accent-border flex items-center justify-center text-[10px] font-bold text-studio-accent hover:bg-studio-accent hover:text-white transition-colors"
          title={isAnonymous ? 'Guest user' : (user.email ?? 'User')}
        >
          {initials}
          {unseen && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-studio-accent ring-2 ring-studio-panel" />
          )}
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

        {/* Replay the walkthrough — otherwise it's strictly one-shot, and the
            one time it runs is the moment you understand the app least. */}
        {inEditor && (
          <button
            type="button"
            onClick={() => startEditorTour(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Replay tour
          </button>
        )}

        {/* Feedback and release notes — the two things a user needs when the
            product surprises them: a way to report it, and a way to find out
            whether it was deliberate. */}
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Send feedback
        </button>

        <button
          type="button"
          onClick={() => setWhatsNewOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          What's new
          {unseen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-studio-accent" />}
        </button>

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

    <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    <WhatsNewDialog open={whatsNewOpen} onClose={closeWhatsNew} />
    </>
  );
}
