"use client";

import {
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ProgressStepsProps {
  steps?: Array<{ label: string }>;
  orientation?: "horizontal" | "vertical";
  activeColor?: string;
  inactiveColor?: string;
  textColor?: string;
  /** Length of the whole track in composition pixels. */
  trackLength?: number;
  /** Radius of a step node in composition pixels. */
  nodeRadius?: number;
  /** Label size in composition pixels. */
  labelSize?: number;
  stepDuration?: number;
  speed?: number;
  className?: string;
}

export function ProgressSteps({
  steps = [{ label: "Connect" }, { label: "Process" }, { label: "Deploy" }],
  orientation = "horizontal",
  activeColor = "#22c55e",
  inactiveColor = "#27272a",
  textColor = "white",
  // Sized for a 1920x1080 composition. The old defaults (920 / 22 / 15) were
  // built for a small preview box and rendered as a hairline with unreadable
  // labels once placed on a real canvas.
  trackLength: trackLengthProp,
  nodeRadius = 40,
  labelSize = 40,
  stepDuration = 30,
  speed = 1,
  className,
}: ProgressStepsProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const isHorizontal = orientation === "horizontal";
  const trackLength = trackLengthProp ?? (isHorizontal ? 1200 : 700);
  const segmentLength = trackLength / Math.max(steps.length - 1, 1);

  // Everything else is derived from the node size, so one control resizes the
  // whole component coherently instead of leaving the parts out of proportion.
  const strokeWidth = Math.max(2, Math.round(nodeRadius * 0.18));
  const gap = Math.round(nodeRadius * 0.6);
  const checkSize = Math.round(nodeRadius * 1.0);

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* SVG layer for connecting lines */}
        <svg
          style={{
            position: "absolute",
            left: isHorizontal ? nodeRadius : "50%",
            top: isHorizontal ? "50%" : nodeRadius,
            transform: isHorizontal ? "translateY(-50%)" : "translateX(-50%)",
            overflow: "visible",
            pointerEvents: "none",
          }}
          width={isHorizontal ? trackLength : strokeWidth}
          height={isHorizontal ? strokeWidth : trackLength}
        >
          {steps.slice(0, -1).map((_, i) => {
            const lineStart = (i + 1) * stepDuration;
            const fillProgress = interpolate(
              frame,
              [lineStart, lineStart + stepDuration],
              [segmentLength, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const mid = strokeWidth / 2;
            return (
              <line
                key={i}
                x1={isHorizontal ? i * segmentLength : mid}
                y1={isHorizontal ? mid : i * segmentLength}
                x2={isHorizontal ? (i + 1) * segmentLength : mid}
                y2={isHorizontal ? mid : (i + 1) * segmentLength}
                stroke={activeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={segmentLength}
                strokeDashoffset={fillProgress}
              />
            );
          })}
          {/* Background track */}
          {steps.slice(0, -1).map((_, i) => {
            const mid = strokeWidth / 2;
            return (
              <line
                key={`bg-${i}`}
                x1={isHorizontal ? i * segmentLength : mid}
                y1={isHorizontal ? mid : i * segmentLength}
                x2={isHorizontal ? (i + 1) * segmentLength : mid}
                y2={isHorizontal ? mid : (i + 1) * segmentLength}
                stroke={inactiveColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{ opacity: 0.6 }}
              />
            );
          })}
        </svg>

        {steps.map((step, i) => {
          const activateAt = i * stepDuration;
          const localFrame = frame - activateAt;
          const popScale = spring({
            frame: localFrame,
            fps,
            config: { damping: 10, stiffness: 180, mass: 0.6 },
          });
          const scale = interpolate(popScale, [0, 1], [0.8, 1]);
          const fill = interpolateColors(
            frame,
            [activateAt, activateAt + 8],
            [inactiveColor, activeColor],
          );
          const showCheck = interpolate(
            frame,
            [activateAt + 6, activateAt + 14],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          return (
            <div
              key={i}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: isHorizontal ? "column" : "row",
                alignItems: "center",
                gap,
                width: isHorizontal ? segmentLength : "auto",
                height: isHorizontal ? "auto" : segmentLength,
                marginRight:
                  isHorizontal && i === steps.length - 1 ? 0 : -segmentLength,
                marginBottom:
                  !isHorizontal && i === steps.length - 1 ? 0 : -segmentLength,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: nodeRadius * 2,
                  height: nodeRadius * 2,
                  borderRadius: 999,
                  background: fill,
                  border: `${strokeWidth}px solid ${activeColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  boxShadow: `0 0 0 ${Math.round(nodeRadius * 0.27)}px ${activeColor}1a`,
                }}
              >
                <svg
                  width={checkSize}
                  height={checkSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ opacity: showCheck }}
                >
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontSize: labelSize,
                  fontWeight: 500,
                  color: textColor,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  position: isHorizontal ? "absolute" : "static",
                  top: isHorizontal ? nodeRadius * 2 + gap : undefined,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
