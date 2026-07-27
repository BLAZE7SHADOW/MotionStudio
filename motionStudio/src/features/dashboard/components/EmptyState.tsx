import { Button } from '@/components/ui/button';
import { Zap, Plus, Loader2 } from 'lucide-react';
import TemplatePreview from './TemplatePreview';
import { STEPS, useQuickDemo } from './gettingStarted';

interface EmptyStateProps {
  onNewProject: () => void;
}

export default function EmptyState({ onNewProject }: EmptyStateProps) {
  const { demo, creating, start: handleQuickDemo } = useQuickDemo();

  return (
    <div className="flex-1 flex flex-col items-center py-14">
      <div className="w-full max-w-245 flex flex-col gap-10">
        {/* Headline */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[26px] font-semibold text-studio-text tracking-tight">
            Let's make your first video
          </h2>
          <p className="text-[14px] text-studio-text-muted max-w-130 leading-relaxed">
            MotionStudio is a video editor that runs entirely in your browser.
            Three steps, about two minutes.
          </p>
        </div>

        {/* Demo preview + the two ways in */}
        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          <div className="rounded-studio-lg border border-studio-border bg-studio-panel p-4">
            {demo ? (
              <TemplatePreview template={demo} />
            ) : (
              <div className="aspect-video rounded-studio-md bg-studio-surface" />
            )}
            <p className="text-[11px] text-studio-text-faint mt-2.5">
              "{demo?.name}" — one of 21 templates. This is a real render, playing live.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-studio-lg border border-studio-accent-border bg-studio-accent-subtle p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-studio-accent" />
                <p className="text-[13px] font-medium text-studio-text">Fastest way in</p>
              </div>
              <p className="text-[12px] text-studio-text-muted leading-relaxed">
                Open this template in the editor right now, already filled in. Change
                the words and export — nothing to set up.
              </p>
              <Button
                size="sm"
                onClick={handleQuickDemo}
                disabled={creating || !demo}
                className="gap-1.5 bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md h-8 text-[13px] w-full"
              >
                {creating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {creating ? 'Opening…' : 'Try a demo project'}
              </Button>
            </div>

            <div className="rounded-studio-lg border border-studio-border bg-studio-panel p-4 flex flex-col gap-2.5">
              <p className="text-[13px] font-medium text-studio-text">
                Or choose your own
              </p>
              <p className="text-[12px] text-studio-text-muted leading-relaxed">
                Browse every template by category, or start from a blank canvas in
                any aspect ratio.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={onNewProject}
                className="gap-1.5 h-8 text-[13px] w-full bg-studio-surface border border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong rounded-studio-md"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[12px] font-medium text-studio-text-muted uppercase tracking-wider">
            How it works
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-studio-lg border border-studio-border bg-studio-panel p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-studio-md bg-studio-surface flex items-center justify-center shrink-0">
                    <step.icon className="w-3.5 h-3.5 text-studio-text-muted" />
                  </div>
                  <span className="text-[11px] font-mono text-studio-text-faint">
                    0{i + 1}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-studio-text">{step.title}</p>
                <p className="text-[12px] text-studio-text-muted leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-studio-text-faint">
            A guided tour runs automatically the first time you open the editor — you
            can replay it any time from the menu in the top right.
          </p>
        </div>
      </div>
    </div>
  );
}
