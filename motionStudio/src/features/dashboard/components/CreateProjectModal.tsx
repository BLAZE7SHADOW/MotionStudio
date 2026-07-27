import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectStore } from '@/engines/project';
import type { AspectRatio } from '@/engines/project';
import { track } from '@/lib/analytics';
import type { TemplateDefinition } from '@/content/templates';
import { instantiateTemplate, templateDurationInFrames, templateShaderPresets } from '@/content/templates';
import { prefetchShaders } from '@/engines/rendering/components/renderers/ShaderRenderer';
import TemplatePicker from './TemplatePicker';
import TemplatePreview from './TemplatePreview';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; sub: string }[] = [
  { value: '16:9', label: '16:9', sub: 'Landscape · YouTube, Presentations' },
  { value: '9:16', label: '9:16', sub: 'Portrait · Reels, TikTok, Shorts' },
  { value: '1:1',  label: '1:1',  sub: 'Square · Instagram, Posts' },
];

const PREVIEW_ASPECT: Record<AspectRatio, string> = {
  '16:9': '16 / 9',
  '9:16': '9 / 16',
  '1:1': '1 / 1',
};

export default function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);

  const [template, setTemplate] = useState<TemplateDefinition | null>(null);

  const [name, setName] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [fps, setFps] = useState(30);

  // Warm every shader the templates use as soon as the dialog opens. Each is
  // its own lazy chunk, so without this the first preview of each shader waits
  // on a fetch — which is exactly why some templates appeared instantly and
  // others lagged. Runs on idle, so it never competes with the preview being
  // looked at right now.
  useEffect(() => {
    if (open) prefetchShaders(templateShaderPresets());
  }, [open]);

  // A template carries its own format; only a blank project needs the controls.
  const isBlank = template === null;
  const effectiveAspectRatio = template?.aspectRatio ?? aspectRatio;
  const effectiveFps = template?.fps ?? fps;

  // Templates supply a sensible default name, so only Blank truly requires one.
  const resolvedName = name.trim() || (template ? template.name : '');
  const canSubmit = resolvedName.length > 0;

  function handleCreate() {
    if (!canSubmit) return;

    const project = createProject({
      name: resolvedName,
      aspectRatio: effectiveAspectRatio,
      fps: effectiveFps,
      elements: template ? instantiateTemplate(template) : undefined,
      durationInFrames: template ? templateDurationInFrames(template) : undefined,
    });

    track.projectCreated({
      aspect_ratio: effectiveAspectRatio,
      fps: effectiveFps,
      template_id: template?.id ?? 'blank',
      template_category: template?.category ?? 'blank',
    });

    handleClose();
    navigate(`/editor/${project.id}`);
  }

  function handleClose() {
    onClose();
    setTemplate(null);
    setName('');
    setAspectRatio('16:9');
    setFps(30);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-215 bg-studio-panel border-studio-border-strong rounded-studio-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-studio-border">
          <DialogTitle className="text-[15px] font-semibold text-studio-text">
            New Project
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[240px_1fr] max-h-[60vh]">
          {/* Template list */}
          <div className="overflow-y-auto border-r border-studio-border px-4 py-4">
            <TemplatePicker selected={template} onSelect={setTemplate} />
          </div>

          {/* Preview + settings for the selection */}
          <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {template ? (
              <>
                <div
                  className="w-full max-h-64 mx-auto rounded-studio-md overflow-hidden border border-studio-border bg-studio-bg"
                  style={{ aspectRatio: PREVIEW_ASPECT[template.aspectRatio] }}
                >
                  <TemplatePreview template={template} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[13px] font-medium text-studio-text">{template.name}</p>
                  <p className="text-[12px] text-studio-text-muted">{template.description}</p>
                  <p className="text-[11px] text-studio-text-faint mt-1">
                    {template.aspectRatio} · {template.fps} fps · {template.durationInSeconds}s ·
                    {' '}{template.elements.length} elements
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-studio-md border border-dashed border-studio-border bg-studio-bg/40 px-4 py-6 text-center">
                  <p className="text-[13px] font-medium text-studio-text">Blank project</p>
                  <p className="text-[12px] text-studio-text-muted mt-0.5">
                    An empty canvas — pick your own format below.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] font-medium text-studio-text-muted uppercase tracking-wider">
                    Aspect Ratio
                  </Label>
                  <Select
                    value={aspectRatio}
                    onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                  >
                    <SelectTrigger className="h-9 text-[13px] bg-studio-surface border-studio-border text-studio-text rounded-studio-md focus:ring-studio-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-studio-panel border-studio-border-strong rounded-studio-lg">
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-[13px] text-studio-text focus:bg-studio-surface [&>span:last-of-type]:flex-1"
                        >
                          <span className="font-medium w-10 shrink-0">{opt.label}</span>
                          <span className="text-[11px] text-studio-text-faint">{opt.sub}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] font-medium text-studio-text-muted uppercase tracking-wider">
                    Frame Rate
                  </Label>
                  <div className="flex gap-2">
                    {[24, 30, 60].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFps(f)}
                        className={[
                          'flex-1 h-9 text-[13px] font-medium rounded-studio-md border transition-colors duration-[120ms]',
                          fps === f
                            ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                            : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                        ].join(' ')}
                      >
                        {f} fps
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-studio-text-muted uppercase tracking-wider">
                Project Name
              </Label>
              <Input
                placeholder={template ? template.name : 'My awesome video'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="h-9 text-[13px] bg-studio-surface border-studio-border text-studio-text placeholder:text-studio-text-faint rounded-studio-md focus-visible:ring-studio-accent focus-visible:border-studio-accent-border"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 px-5 py-4 border-t border-studio-border bg-studio-bg/40 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 px-4 text-[13px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-md"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="h-8 px-4 text-[13px] bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md disabled:opacity-40"
          >
            {isBlank ? 'Create Project' : 'Use Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
