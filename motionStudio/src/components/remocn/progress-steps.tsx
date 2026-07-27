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

/**
 * A pipeline whose steps light up in sequence.
 *
 * Nodes are positioned absolutely along the track rather than laid out by flex.
 * The original used `width: segment` with `marginRight: -segment` on each step,
 * which cancels every item's own width — so all the nodes landed on the same x
 * and the component rendered as a bare line. Absolute offsets make each node's
 * position a direct function of the track length, which is also what lets the
 * size controls behave predictably.
 */
export function ProgressSteps({
  steps = [{ label: "Connect" }, { label: "Process" }, { label: "Deploy" }],
  orientation = "horizontal",
  activeColor = "#22c55e",
  inactiveColor = "#27272a",
  textColor = "white",
  // Sized for a 1920x1080 composition. The original defaults (920 / 22 / 15)
  // were built against a small preview box and are unreadable on a real canvas.
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
  const segment = trackLength / Math.max(steps.length - 1, 1);

  // Derived from node size so one control resizes the whole thing in proportion.
  const strokeWidth = Math.max(2, Math.round(nodeRadius * 0.18));
  const gap = Math.round(nodeRadius * 0.6);
  const checkSize = Math.round(nodeRadius * 1.1);
  const labelBox = Math.round(labelSize * 1.4);
  // Vertical labels sit beside the nodes, so the box has to reserve room for
  // them; horizontal labels sit underneath and only need their own height.
  const labelReserve = Math.round(labelSize * 8);

  const boxWidth = isHorizontal
    ? trackLength + nodeRadius * 2
    : nodeRadius * 2 + gap + labelReserve;
  const boxHeight = isHorizontal
    ? nodeRadius * 2 + gap + labelBox
    : trackLength + nodeRadius * 2;

  /** Centre of node `i` along the track, measured from the box's top-left. */
  const nodeOffset = (i: number) => nodeRadius + i * segment;

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
      <div style={{ position: "relative", width: boxWidth, height: boxHeight }}>
        {/* Track — one background bar, then a fill per segment that grows in turn */}
        <div
          style={{
            position: "absolute",
            left: isHorizontal ? nodeRadius : nodeRadius - strokeWidth / 2,
            top: isHorizontal ? nodeRadius - strokeWidth / 2 : nodeRadius,
            width: isHorizontal ? trackLength : strokeWidth,
            height: isHorizontal ? strokeWidth : trackLength,
            background: inactiveColor,
            opacity: 0.6,
            borderRadius: 999,
          }}
        />

        {steps.slice(0, -1).map((_, i) => {
          // Segment i runs between node i lighting up and node i+1 lighting up,
          // so the line arrives exactly as the next node activates. Starting it
          // a step later left each node checked while its incoming line was
          // still only half drawn.
          const fillStart = i * stepDuration;
          const grown = interpolate(
            frame,
            [fillStart, fillStart + stepDuration],
            [0, segment],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={`fill-${i}`}
              style={{
                position: "absolute",
                left: isHorizontal
                  ? nodeOffset(i)
                  : nodeRadius - strokeWidth / 2,
                top: isHorizontal
                  ? nodeRadius - strokeWidth / 2
                  : nodeOffset(i),
                width: isHorizontal ? grown : strokeWidth,
                height: isHorizontal ? strokeWidth : grown,
                background: activeColor,
                borderRadius: 999,
              }}
            />
          );
        })}

        {steps.map((step, i) => {
          const activateAt = i * stepDuration;
          const popScale = spring({
            frame: frame - activateAt,
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
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: isHorizontal ? nodeOffset(i) : nodeRadius,
                  top: isHorizontal ? nodeRadius : nodeOffset(i),
                  width: nodeRadius * 2,
                  height: nodeRadius * 2,
                  marginLeft: -nodeRadius,
                  marginTop: -nodeRadius,
                  borderRadius: 999,
                  background: fill,
                  border: `${strokeWidth}px solid ${activeColor}`,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${scale})`,
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
                  position: "absolute",
                  left: isHorizontal
                    ? nodeOffset(i)
                    : nodeRadius * 2 + gap,
                  top: isHorizontal
                    ? nodeRadius * 2 + gap
                    : nodeOffset(i),
                  transform: isHorizontal
                    ? "translateX(-50%)"
                    : "translateY(-50%)",
                  fontSize: labelSize,
                  lineHeight: 1.2,
                  fontWeight: 500,
                  color: textColor,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  opacity: interpolate(
                    frame,
                    [activateAt, activateAt + 10],
                    [0.45, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  ),
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
