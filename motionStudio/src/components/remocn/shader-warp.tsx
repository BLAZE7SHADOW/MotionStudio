"use client";
import { useEffect } from "react";

import { Warp, type WarpProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#12121a", "#3a3a5c", "#12121a", "#52527a"];

export interface ShaderWarpProps extends Omit<WarpProps, "frame" | "ref"> {}

export function ShaderWarp({
  speed = 1,
  colors = NEUTRAL_COLORS,
  proportion = 0.5,
  softness = 1,
  distortion = 0.2,
  swirl = 0.4,
  className,
  ...rest
}: ShaderWarpProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-warp");
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
      <Warp
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        proportion={proportion}
        softness={softness}
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
