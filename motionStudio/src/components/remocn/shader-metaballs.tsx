"use client";
import { useEffect } from "react";

import { Metaballs, type MetaballsProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#3a3a5c", "#52527a", "#8a8a95"];

export interface ShaderMetaballsProps
  extends Omit<MetaballsProps, "frame" | "ref"> {}

export function ShaderMetaballs({
  speed = 1,
  colorBack = "#12121a",
  colors = NEUTRAL_COLORS,
  count = 10,
  size = 0.83,
  className,
  ...rest
}: ShaderMetaballsProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-metaballs");
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
      <Metaballs
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colors={colors}
        count={count}
        size={size}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
