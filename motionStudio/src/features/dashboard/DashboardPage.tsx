import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useProjectStore, projectShaderPresets } from '@/engines/project';
import { prefetchShaders } from '@/engines/rendering/components/renderers/ShaderRenderer';
import { useAuth } from '@/hooks/useAuth';
import DesktopOnlyGate from '@/components/DesktopOnlyGate';
import DashboardHeader from './components/DashboardHeader';
import ProjectGrid from './components/ProjectGrid';
import EmptyState from './components/EmptyState';
import CreateProjectModal from './components/CreateProjectModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const projects = useProjectStore((s) => s.projects);
  const [modalOpen, setModalOpen] = useState(false);

  // Warm the shaders these projects actually use. Cards below the fold don't
  // mount their thumbnail until scrolled near, so without this, scrolling
  // stalls on a fetch. Bounded by definition: never more than the thumbnails
  // would load anyway, just sooner. Runs on idle.
  useEffect(() => {
    if (projects.length > 0) prefetchShaders(projectShaderPresets(projects));
  }, [projects]);

  // auth guard — not logged in → back to landing
  useEffect(() => {
    if (!loading && !user) navigate('/', { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-studio-text-muted" />
      </div>
    );
  }

  return (
    <DesktopOnlyGate
      title="Your projects need a bigger screen"
      description="The dashboard is designed for laptop and desktop displays so you can browse and manage projects comfortably."
    >
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
    </DesktopOnlyGate>
  );
}
