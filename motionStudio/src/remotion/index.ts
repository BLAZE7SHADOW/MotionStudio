import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

// Entry point for the Remotion CLI (`npx remotion render` / `studio`).
// Not imported by the browser app — it only runs inside Remotion's bundler.
registerRoot(RemotionRoot);
