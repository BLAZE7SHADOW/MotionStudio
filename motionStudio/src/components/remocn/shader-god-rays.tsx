"use client";
import { useEffect } from "react";

import { GodRays, type GodRaysProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#5a5a7e", "#8a8a95", "#ffffff", "#3a3a5c"];

export interface ShaderGodRaysProps
  extends Omit<GodRaysProps, "frame" | "ref"> {}

export function ShaderGodRays({
  speed = 1,
  colorBack = "#12121a",
  colorBloom = "#3a3a5c",
  colors = NEUTRAL_COLORS,
  intensity = 0.8,
  density = 0.3,
  bloom = 0.4,
  className,
  ...rest
}: ShaderGodRaysProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-god-rays");
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
      <GodRays
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorBloom={colorBloom}
        colors={colors}
        intensity={intensity}
        density={density}
        bloom={bloom}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
