import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/engines/project';

type Category = 'bug' | 'idea' | 'other';

const CATEGORIES: { value: Category; label: string; hint: string }[] = [
  { value: 'bug', label: 'Something broke', hint: 'It did the wrong thing, or nothing at all.' },
  { value: 'idea', label: 'I want something', hint: 'A feature, an effect, a template.' },
  { value: 'other', label: 'Something else', hint: 'Anything that doesn’t fit the other two.' },
];

/**
 * Collects the technical context that turns "it doesn't work" into a report
 * worth acting on.
 *
 * Almost all unstructured feedback is unactionable — not because people are
 * unhelpful, but because they don't know which details matter. Nobody thinks to
 * mention their aspect ratio or that they were on Safari. Gathering it
 * automatically is the difference between a form that generates work and one
 * that generates fixes.
 *
 * Shown to the user before sending. Attaching diagnostics silently would be a
 * cheap trick; attaching them visibly is a courtesy.
 */
function collectContext(pathname: string, project: { id: string; aspectRatio: string; fps: number; durationInFrames: number; canvas: { elements: unknown[] }; assets: unknown[] } | undefined) {
  const lines = [
    `page: ${pathname}`,
    `build: ${__APP_VERSION__}`,
    `screen: ${window.innerWidth}x${window.innerHeight}`,
    `browser: ${navigator.userAgent}`,
  ];
  if (project) {
    lines.push(
      `project: ${project.id}`,
      `format: ${project.aspectRatio} · ${project.fps}fps · ${Math.round(project.durationInFrames / project.fps)}s`,
      `contents: ${project.canvas.elements.length} elements, ${project.assets.length} assets`,
    );
  }
  return lines;
}

export default function FeedbackDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { pathname } = useLocation();
  const { user, isAnonymous } = useAuth();

  // The editor route carries the project id; on the dashboard there isn't one.
  const projectId = pathname.startsWith('/editor/') ? pathname.split('/')[2] : undefined;
  const project = useProjectStore((s) => (projectId ? s.getProject(projectId) : undefined));

  const [category, setCategory] = useState<Category>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);

  const context = collectContext(pathname, project);
  const canSubmit = message.trim().length > 0 && email.trim().length > 0 && !sending;

  function reset() {
    setMessage('');
    setSent(false);
    setError(null);
    setShowContext(false);
  }

  async function handleSend() {
    if (!canSubmit) return;
    setSending(true);
    setError(null);

    const label = CATEGORIES.find((c) => c.value === category)?.label ?? category;
    const body = [
      `[${label}]`,
      '',
      message.trim(),
      '',
      '— context —',
      ...context,
    ].join('\n');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isAnonymous ? 'Guest user' : (user?.email ?? 'MotionStudio user'),
          email: email.trim(),
          message: body,
        }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error("Feedback couldn't be sent — the API isn't reachable from here.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Send failed');

      // The endpoint reports `fallback` when no mail key is configured rather
      // than pretending it sent. Say so instead of showing a false success.
      if (data.fallback) {
        throw new Error('Email delivery isn’t configured on this deployment yet.');
      }

      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { onClose(); reset(); }
      }}
    >
      <DialogContent className="sm:max-w-125 bg-studio-panel border-studio-border-strong rounded-studio-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-studio-border">
          <DialogTitle className="text-[15px] font-semibold text-studio-text">
            Send feedback
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="px-5 py-8 flex flex-col items-center gap-2.5 text-center">
            <div className="w-9 h-9 rounded-full bg-studio-accent-subtle border border-studio-accent-border flex items-center justify-center">
              <Check className="w-4 h-4 text-studio-accent" />
            </div>
            <p className="text-[13px] font-medium text-studio-text">Sent — thank you</p>
            <p className="text-[12px] text-studio-text-muted max-w-80 leading-relaxed">
              This goes to a real inbox, and a reply comes back to{' '}
              <span className="font-mono text-studio-text">{email.trim()}</span>.
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-studio-text-muted uppercase tracking-wider">
                What kind of thing?
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    title={c.hint}
                    className={[
                      'h-8 text-[12px] font-medium rounded-studio-md border transition-colors duration-120',
                      category === c.value
                        ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                        : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                    ].join(' ')}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-studio-text-faint">
                {CATEGORIES.find((c) => c.value === category)?.hint}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-studio-text-muted uppercase tracking-wider">
                What happened?
              </Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                autoFocus
                maxLength={4000}
                placeholder={
                  category === 'bug'
                    ? 'What were you doing, and what did you expect instead?'
                    : 'Describe it in your own words — detail helps but isn’t required.'
                }
                className="w-full resize-none rounded-studio-md bg-studio-surface border border-studio-border text-[12px] text-studio-text px-2.5 py-2 placeholder:text-studio-text-faint focus:outline-none focus:border-studio-accent-border focus:ring-1 focus:ring-studio-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-studio-text-muted uppercase tracking-wider">
                Where to reply
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-8 text-[12px] bg-studio-surface border-studio-border text-studio-text rounded-studio-md"
              />
              {isAnonymous && (
                <p className="text-[11px] text-studio-text-faint">
                  You're signed in as a guest, so there's no address on file — without
                  one there's no way to tell you it's fixed.
                </p>
              )}
            </div>

            {/* Transparency, not a disclaimer: the user can read exactly what
                travels with their message before they send it. */}
            <div className="rounded-studio-md border border-studio-border bg-studio-bg/40 px-2.5 py-2">
              <button
                type="button"
                onClick={() => setShowContext((v) => !v)}
                className="text-[11px] text-studio-text-muted hover:text-studio-text transition-colors"
              >
                {showContext ? '▾' : '▸'} Sent with your message: browser, screen size
                {project ? ', and this project’s format' : ''} ({context.length} details)
              </button>
              {showContext && (
                <pre className="mt-2 text-[10px] text-studio-text-faint font-mono whitespace-pre-wrap break-all leading-relaxed">
                  {context.join('\n')}
                </pre>
              )}
            </div>

            {error && <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>}
          </div>
        )}

        <DialogFooter className="mx-0 mb-0 px-5 py-4 border-t border-studio-border bg-studio-bg/40 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { onClose(); reset(); }}
            className="h-8 px-4 text-[13px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-md"
          >
            {sent ? 'Close' : 'Cancel'}
          </Button>
          {!sent && (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSubmit}
              className="h-8 px-4 text-[13px] bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md disabled:opacity-40 gap-1.5"
            >
              {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {sending ? 'Sending…' : 'Send'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
