// color.ts (culori-based) and theme.ts are omitted — only typewriter uses
// this lib and it only needs the timeline utilities below.
export type { EasingName, SpringName } from "./motion";
export { easings, springs } from "./motion";
export type { TypewriterOptions, TypewriterState } from "./timeline";
export {
  clamp01,
  framesFor,
  revealCount,
  revealedText,
  useCurrentState,
  useStateTransition,
  useTypewriter,
} from "./timeline";
export type { Step } from "./types";
