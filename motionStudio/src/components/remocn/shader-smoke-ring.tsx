"use client";
import { useEffect } from "react";

import { SmokeRing, type SmokeRingProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#c8c8d0"];

export interface ShaderSmokeRingProps
  extends Omit<SmokeRingProps, "frame" | "ref"> {}

export function ShaderSmokeRing({
  speed = 1,
  colorBack = "#12121a",
  colors = NEUTRAL_COLORS,
  radius = 0.25,
  thickness = 0.65,
  scale = 0.8,
  className,
  ...rest
}: ShaderSmokeRingProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-smoke-ring");
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
      <SmokeRing
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colors={colors}
        radius={radius}
        thickness={thickness}
        scale={scale}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
