import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
  }

  const isNotFound = status === 404;

  return (
    <div className="min-h-screen bg-studio-bg flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-studio-accent-subtle border border-studio-accent-border flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-studio-accent" />
          </div>
        </div>

        <h1 className="text-[32px] font-semibold text-studio-text mb-2">
          {status}
        </h1>

        <p className="text-[15px] text-studio-text-secondary mb-2">
          {isNotFound
            ? 'Page not found'
            : 'Oops! Something went wrong'}
        </p>

        <p className="text-[13px] text-studio-text-muted mb-8">
          {isNotFound
            ? "The page you're looking for doesn't exist or has been moved."
            : 'Please try refreshing the page or going back home.'}
        </p>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-studio-md bg-studio-accent hover:bg-studio-accent-hover text-white text-[13px] font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to home
        </button>
      </div>
    </div>
  );
}
