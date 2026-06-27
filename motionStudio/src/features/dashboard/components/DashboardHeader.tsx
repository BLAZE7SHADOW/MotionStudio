import { Button } from '@/components/ui/button';
import { Plus, Clapperboard } from 'lucide-react';

interface DashboardHeaderProps {
  onNewProject: () => void;
}

export default function DashboardHeader({ onNewProject }: DashboardHeaderProps) {
  return (
    <header className="h-14 border-b border-studio-border bg-studio-panel flex items-center justify-between px-6">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-studio-sm bg-studio-accent flex items-center justify-center">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-studio-text">
          MotionStudio
        </span>
      </div>

      <Button
        size="sm"
        className="gap-1.5 bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md h-8 px-3 text-[13px]"
        onClick={onNewProject}
      >
        <Plus className="w-3.5 h-3.5" />
        New Project
      </Button>
    </header>
  );
}
