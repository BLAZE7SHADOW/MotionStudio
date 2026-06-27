import { Button } from '@/components/ui/button';
import { Film, Plus } from 'lucide-react';

interface EmptyStateProps {
  onNewProject: () => void;
}

export default function EmptyState({ onNewProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 py-32">
      <div className="w-14 h-14 rounded-studio-lg bg-studio-surface flex items-center justify-center">
        <Film className="w-7 h-7 text-studio-text-faint" />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-[15px] font-medium text-studio-text">No projects yet</p>
        <p className="text-[13px] text-studio-text-muted">
          Create your first project to get started
        </p>
      </div>

      <Button
        size="sm"
        className="gap-1.5 bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md h-8 px-4 text-[13px]"
        onClick={onNewProject}
      >
        <Plus className="w-3.5 h-3.5" />
        New Project
      </Button>
    </div>
  );
}
