"use client";
import { useEffect } from "react";

import { Voronoi, type VoronoiProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#3a3a5c", "#52527a"];

export interface ShaderVoronoiProps
  extends Omit<VoronoiProps, "frame" | "ref"> {}

export function ShaderVoronoi({
  speed = 1,
  colors = NEUTRAL_COLORS,
  colorGap = "#12121a",
  distortion = 0.4,
  gap = 0.04,
  glow = 0,
  className,
  ...rest
}: ShaderVoronoiProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-voronoi");
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
      <Voronoi
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        colorGap={colorGap}
        distortion={distortion}
        gap={gap}
        glow={glow}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
