"use client";
import { useEffect } from "react";

import {
  SimplexNoise,
  type SimplexNoiseProps,
} from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#12121a", "#3a3a5c", "#52527a", "#8a8a95"];

export interface ShaderSimplexNoiseProps
  extends Omit<SimplexNoiseProps, "frame" | "ref"> {}

export function ShaderSimplexNoise({
  speed = 1,
  colors = NEUTRAL_COLORS,
  stepsPerColor = 2,
  softness = 0.1,
  className,
  ...rest
}: ShaderSimplexNoiseProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-simplex-noise");
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => continueRender(handle));
    });
    // cleanup ALWAYS runs — including on the discarded mount of a React
    // StrictMode double-invoke — so the handle never leaks unresolved and
    // blocks Remotion (Player or renderMedia) from ever marking this ready.
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      continueRender(handle);
    };
  }, []);

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0 }}
    >
      <SimplexNoise
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        stepsPerColor={stepsPerColor}
        softness={softness}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
