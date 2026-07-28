import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Clapperboard } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import HelpMenu from '@/components/HelpMenu';

interface DashboardHeaderProps {
  onNewProject: () => void;
}

export default function DashboardHeader({ onNewProject }: DashboardHeaderProps) {
  return (
    <header className="h-14 border-b border-studio-border bg-studio-panel flex items-center justify-between px-6">
      <Link
        to="/"
        title="Go to the home page"
        className="flex items-center gap-2.5 rounded-studio-sm px-1 -mx-1 py-1 hover:bg-studio-surface transition-colors duration-[120ms]"
      >
        <div className="w-7 h-7 rounded-studio-sm bg-studio-accent flex items-center justify-center">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-studio-text">
          MotionStudio
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="gap-1.5 bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md h-8 px-3 text-[13px]"
          onClick={onNewProject}
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </Button>

        <HelpMenu />
        <UserMenu />
      </div>
    </header>
  );
}
