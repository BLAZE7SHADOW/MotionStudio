"use client";
import { useEffect } from "react";

import { Swirl, type SwirlProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#52527a", "#3a3a5c", "#232338"];

export interface ShaderSwirlProps extends Omit<SwirlProps, "frame" | "ref"> {}

export function ShaderSwirl({
  speed = 1,
  colors = NEUTRAL_COLORS,
  colorBack = "#12121a",
  bandCount = 4,
  twist = 0.1,
  softness = 0.2,
  className,
  ...rest
}: ShaderSwirlProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-swirl");
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
      <Swirl
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        colorBack={colorBack}
        bandCount={bandCount}
        twist={twist}
        softness={softness}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
