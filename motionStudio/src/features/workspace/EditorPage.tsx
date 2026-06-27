import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/engines/project';
import { useEditorStore } from '@/engines/editor';
import EditorLayout from './components/EditorLayout';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const project = useProjectStore((s) => s.getProject(projectId ?? ''));
  const reset = useEditorStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [projectId, reset]);

  if (!project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-studio-bg">
        <p className="text-[13px] text-studio-text-muted">Project not found.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[13px] text-studio-accent hover:text-studio-accent-hover underline underline-offset-2 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <EditorLayout project={project} />;
}
