"use client";
import { useEffect } from "react";

import { NeuroNoise, type NeuroNoiseProps } from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ShaderNeuroNoiseProps
  extends Omit<NeuroNoiseProps, "frame" | "ref"> {}

export function ShaderNeuroNoise({
  speed = 1,
  colorFront = "#8a8a95",
  colorMid = "#4a4a68",
  colorBack = "#12121a",
  brightness = 0.05,
  contrast = 0.3,
  className,
  ...rest
}: ShaderNeuroNoiseProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-neuro-noise");
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
      <NeuroNoise
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorFront={colorFront}
        colorMid={colorMid}
        colorBack={colorBack}
        brightness={brightness}
        contrast={contrast}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
