import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardPage from './features/dashboard/DashboardPage';
import EditorPage from './features/workspace/EditorPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/editor/:projectId',
    element: <EditorPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
