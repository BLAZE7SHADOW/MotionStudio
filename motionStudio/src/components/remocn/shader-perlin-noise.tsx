"use client";
import { useEffect } from "react";

import {
  PerlinNoise,
  type PerlinNoiseProps,
} from "@paper-design/shaders-react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ShaderPerlinNoiseProps
  extends Omit<PerlinNoiseProps, "frame" | "ref"> {}

export function ShaderPerlinNoise({
  speed = 1,
  colorBack = "#12121a",
  colorFront = "#6a6a85",
  proportion = 0.35,
  softness = 0.1,
  className,
  ...rest
}: ShaderPerlinNoiseProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender("shader-perlin-noise");
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
      <PerlinNoise
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorFront={colorFront}
        proportion={proportion}
        softness={softness}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
