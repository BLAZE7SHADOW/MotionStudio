"use client";
import { useEffect } from "react";

import { Water, type WaterProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ShaderWaterProps extends Omit<WaterProps, "frame" | "ref"> {}

export function ShaderWater({
  speed = 1,
  colorBack = "#16202b",
  colorHighlight = "#5a6a7a",
  highlights = 0.06,
  waves = 0.3,
  caustic = 0.08,
  className,
  ...rest
}: ShaderWaterProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-water");
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
      <Water
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorHighlight={colorHighlight}
        highlights={highlights}
        waves={waves}
        caustic={caustic}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
