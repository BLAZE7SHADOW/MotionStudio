import { useEditorStore } from '@/engines/editor';

const TRACK_HEADER_W = 140;
const TRACK_H = 40;

export default function TimelinePanel() {
  const currentFrame = useEditorStore((s) => s.currentFrame);

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
      {/* Timeline header */}
      <div className="h-9 border-b border-studio-border flex items-center justify-between px-4 shrink-0">
        <span className="text-[11px] font-semibold text-studio-text-faint uppercase tracking-widest">
          Timeline
        </span>
        <span className="text-[11px] font-mono text-studio-text-faint">
          F {currentFrame}
        </span>
      </div>

      {/* Track area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Track headers */}
        <div
          className="border-r border-studio-border flex flex-col shrink-0"
          style={{ width: TRACK_HEADER_W }}
        >
          <div
            className="flex items-center px-4 border-b border-studio-border"
            style={{ height: TRACK_H }}
          >
            <span className="text-[12px] text-studio-text-muted">Track 1</span>
          </div>
        </div>

        {/* Track body */}
        <div className="flex-1 relative overflow-hidden">
          {/* Time ruler */}
          <div
            className="flex items-end px-4 border-b border-studio-border"
            style={{ height: TRACK_H }}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex-1 relative">
                <span className="absolute bottom-1.5 left-0 text-[10px] font-mono text-studio-text-faint">
                  {i}s
                </span>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-studio-accent z-10 pointer-events-none"
            style={{ left: 0 }}
          >
            <div className="absolute -top-0.5 -left-[4px] w-2 h-2 rounded-full bg-studio-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}
