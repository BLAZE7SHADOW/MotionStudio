"use client";
import { useEffect } from "react";

import {
  MeshGradient,
  type MeshGradientProps,
} from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#12121a", "#232338", "#3a3a5c", "#52527a"];

export interface ShaderMeshGradientProps
  extends Omit<MeshGradientProps, "frame" | "ref"> {}

export function ShaderMeshGradient({
  speed = 1,
  colors = NEUTRAL_COLORS,
  distortion = 0.6,
  swirl = 0.1,
  className,
  ...rest
}: ShaderMeshGradientProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-mesh-gradient");
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
      <MeshGradient
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        distortion={distortion}
        swirl={swirl}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
