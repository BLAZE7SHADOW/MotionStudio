import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, MessageSquare, Sparkles, Rocket, Keyboard, Lightbulb } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { startEditorTour } from '@/features/workspace/tour/useEditorTour';
import { hasUnseenRelease, markReleasesSeen } from '@/lib/releaseSeen';
import { clearSuppressions } from '@/lib/notices';
import { useHelperMode } from '@/lib/helperMode';
import { track } from '@/lib/analytics';
import { useFeedbackStore } from '@/lib/feedbackStore';
import FeedbackDialog from './FeedbackDialog';
import WhatsNewDialog from './WhatsNewDialog';
import ShortcutsDialog from './ShortcutsDialog';

/**
 * Help, feedback and release notes, in one obvious place.
 *
 * These used to sit in the account menu, which is a circle showing your initial
 * — nothing about it suggests "report a bug" or "what changed". Identity and
 * help are different jobs, and putting them behind the same avatar meant one of
 * them was always undiscoverable. This takes a toolbar slot; the account menu
 * keeps identity and sign-out.
 *
 * One button rather than two: feedback and release notes are both occasional,
 * and two permanent controls for occasional actions is a poor trade for toolbar
 * space next to Preview and Export.
 */
export default function HelpMenu() {
  const { pathname } = useLocation();
  // Shared with the dashboard, where there's no editor to tour.
  const inEditor = pathname.startsWith('/editor');

  const [open, setOpen] = useState(false);
  const openFeedback = useFeedbackStore((s) => s.openFeedback);

  // One side-effecting read at mount, shared by the dot and the auto-open.
  // hasUnseenRelease() marks a first-ever visit as seen rather than returning
  // true, so a brand-new user is never met with a changelog.
  const [initiallyUnseen] = useState(hasUnseenRelease);
  const [unseen, setUnseen] = useState(initiallyUnseen);
  const [whatsNewOpen, setWhatsNewOpen] = useState(initiallyUnseen);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const helperOn = useHelperMode((s) => s.on);
  const setHelperOn = useHelperMode((s) => s.setOn);

  /* Replaying the walkthrough also brings back every hint the user dismissed
     with DON'T SHOW AGAIN. Both are the same request — "explain this to me
     again" — and a replayed walkthrough that still can't show the beat hint
     would be one that lies about what the app tells you. */
  function replayTour() {
    clearSuppressions();
    startEditorTour(true);
  }

  function closeWhatsNew() {
    setWhatsNewOpen(false);
    markReleasesSeen();
    setUnseen(false);
  }

  const item =
    'w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm transition-colors';

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-tour="help"
            title="Help, feedback and what's new"
            aria-label="Help and feedback"
            className="relative w-7 h-7 rounded-studio-md flex items-center justify-center text-studio-text-muted hover:text-studio-text hover:bg-studio-surface transition-colors duration-120"
          >
            <HelpCircle className="w-3.75 h-3.75" />
            {unseen && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-studio-accent" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-52 p-2 bg-studio-panel border-studio-border-strong rounded-studio-lg shadow-studio-lg"
        >
          {/* Replaying the walkthrough matters: the one time it runs by itself
              is the moment you understand the app least — and replaying it with
              things on the canvas is when its steps have something to act on. */}
          {inEditor && (
            <button
              type="button"
              onClick={() => { setOpen(false); replayTour(); }}
              className={item}
            >
              <Rocket className="w-3.5 h-3.5" />
              Quick start
            </button>
          )}

          {/* Mirrors the toolbar switch. Someone hunting for help looks under
              the question mark, not at an icon they haven't decoded yet. */}
          {inEditor && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                track.helperModeToggled({ on: !helperOn });
                setHelperOn(!helperOn);
              }}
              className={item}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Hover to learn
              <span className="ml-auto text-[10px] uppercase tracking-widest text-studio-text-faint">
                {helperOn ? 'On' : 'Off'}
              </span>
            </button>
          )}

          {inEditor && (
            <button
              type="button"
              onClick={() => { setOpen(false); setShortcutsOpen(true); }}
              className={item}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Keyboard shortcuts
            </button>
          )}

          <button
            type="button"
            onClick={() => { setOpen(false); openFeedback(); }}
            className={item}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Send feedback
          </button>

          <button
            type="button"
            onClick={() => { setOpen(false); setWhatsNewOpen(true); }}
            className={item}
          >
            <Sparkles className="w-3.5 h-3.5" />
            What's new
            {unseen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-studio-accent" />}
          </button>
        </PopoverContent>
      </Popover>

      {/* Mounted once here; anything can open it through the store. */}
      <FeedbackDialog />
      <WhatsNewDialog open={whatsNewOpen} onClose={closeWhatsNew} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
