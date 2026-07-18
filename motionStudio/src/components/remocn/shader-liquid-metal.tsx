"use client";
import { useEffect } from "react";

import {
  LiquidMetal,
  type LiquidMetalProps,
} from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ShaderLiquidMetalProps
  extends Omit<LiquidMetalProps, "frame" | "ref"> {}

export function ShaderLiquidMetal({
  speed = 1,
  colorBack = "#2a2a30",
  colorTint = "#8a8a95",
  distortion = 0.1,
  repetition = 1.5,
  contour = 0.4,
  softness = 0.05,
  shape = "none",
  className,
  ...rest
}: ShaderLiquidMetalProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-liquid-metal");
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
      <LiquidMetal
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorTint={colorTint}
        distortion={distortion}
        repetition={repetition}
        contour={contour}
        softness={softness}
        shape={shape}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
