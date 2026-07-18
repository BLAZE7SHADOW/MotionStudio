"use client";
import { useEffect } from "react";

import { DotOrbit, type DotOrbitProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#4a4a68", "#52527a", "#3a3a5c"];

export interface ShaderDotOrbitProps
  extends Omit<DotOrbitProps, "frame" | "ref"> {}

export function ShaderDotOrbit({
  speed = 1,
  colorBack = "#12121a",
  colors = NEUTRAL_COLORS,
  size = 1,
  spreading = 1,
  className,
  ...rest
}: ShaderDotOrbitProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-dot-orbit");
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
      <DotOrbit
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colors={colors}
        size={size}
        spreading={spreading}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
