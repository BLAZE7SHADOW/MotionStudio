import { useState } from 'react';
import { useProjectStore } from '@/engines/project';
import DashboardHeader from './components/DashboardHeader';
import ProjectGrid from './components/ProjectGrid';
import EmptyState from './components/EmptyState';
import CreateProjectModal from './components/CreateProjectModal';

export default function DashboardPage() {
  const projects = useProjectStore((s) => s.projects);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-studio-bg">
      <DashboardHeader onNewProject={() => setModalOpen(true)} />

      <main className="flex-1 flex flex-col px-6 py-8 max-w-[1400px] mx-auto w-full">
        {projects.length === 0 ? (
          <EmptyState onNewProject={() => setModalOpen(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[13px] font-medium text-studio-text-muted uppercase tracking-wider">
                Projects
              </h2>
              <span className="text-[12px] text-studio-text-faint">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ProjectGrid projects={projects} />
          </>
        )}
      </main>

      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
