"use client";
import { useEffect } from "react";

import { Dithering, type DitheringProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ShaderDitheringProps
  extends Omit<DitheringProps, "frame" | "ref"> {}

export function ShaderDithering({
  speed = 1,
  colorBack = "#12121a",
  colorFront = "#6a6a85",
  shape = "wave",
  type = "4x4",
  size = 2,
  className,
  ...rest
}: ShaderDitheringProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-dithering");
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
      <Dithering
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorFront={colorFront}
        shape={shape}
        type={type}
        size={size}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
