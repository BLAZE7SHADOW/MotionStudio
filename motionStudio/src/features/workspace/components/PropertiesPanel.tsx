import { MousePointer } from 'lucide-react';
import { useEditorStore } from '@/engines/editor';

export default function PropertiesPanel() {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
      <div className="px-4 h-9 flex items-center border-b border-studio-border shrink-0">
        <span className="text-[11px] font-semibold text-studio-text-faint uppercase tracking-widest">
          Properties
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-2.5 px-5">
        {selectedElementId === null ? (
          <>
            <MousePointer className="w-5 h-5 text-studio-text-faint" strokeWidth={1.5} />
            <p className="text-[12px] text-studio-text-faint text-center leading-relaxed">
              Select an element to<br />edit its properties
            </p>
          </>
        ) : (
          <p className="text-[12px] text-studio-text-muted font-mono">
            {selectedElementId}
          </p>
        )}
      </div>
    </div>
  );
}
