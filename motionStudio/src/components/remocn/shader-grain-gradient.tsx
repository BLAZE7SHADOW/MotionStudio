"use client";
import { useEffect } from "react";

import {
  GrainGradient,
  type GrainGradientProps,
} from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#3a3a52", "#4a4a68", "#5a5a7e"];

export interface ShaderGrainGradientProps
  extends Omit<GrainGradientProps, "frame" | "ref"> {}

export function ShaderGrainGradient({
  speed = 1,
  colors = NEUTRAL_COLORS,
  colorBack = "#12121a",
  softness = 0.6,
  intensity = 0.2,
  noise = 0.15,
  className,
  ...rest
}: ShaderGrainGradientProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-grain-gradient");
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
      <GrainGradient
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        colorBack={colorBack}
        softness={softness}
        intensity={intensity}
        noise={noise}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
