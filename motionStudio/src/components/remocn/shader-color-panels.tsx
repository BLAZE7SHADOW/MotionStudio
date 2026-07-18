"use client";
import { useEffect } from "react";

import {
  ColorPanels,
  type ColorPanelsProps,
} from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#3a3a52", "#4a4a68", "#52527a", "#5a5a8a"];

export interface ShaderColorPanelsProps
  extends Omit<ColorPanelsProps, "frame" | "ref"> {}

export function ShaderColorPanels({
  speed = 1,
  colors = NEUTRAL_COLORS,
  colorBack = "#12121a",
  density = 3,
  length = 1.1,
  className,
  ...rest
}: ShaderColorPanelsProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-color-panels");
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
      <ColorPanels
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        colorBack={colorBack}
        density={density}
        length={length}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
