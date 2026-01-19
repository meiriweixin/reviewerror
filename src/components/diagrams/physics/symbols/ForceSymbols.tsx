import React from 'react';
import { VectorProps } from '../../../../types/diagram';

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 2;

/**
 * Force Vector with arrowhead
 * Direction in degrees: 0=right, 90=up, 180=left, 270=down
 */
export const ForceVector: React.FC<VectorProps> = ({
  x, y, direction, magnitude, label, color = STROKE_COLOR, strokeWidth = STROKE_WIDTH
}) => {
  // Convert direction to radians (SVG y-axis is inverted)
  const radians = (direction * Math.PI) / 180;
  const endX = x + magnitude * Math.cos(radians);
  const endY = y - magnitude * Math.sin(radians); // Negative because SVG y increases downward

  // Arrowhead calculations
  const arrowLength = 12;
  const arrowAngle = 25 * Math.PI / 180;

  // Calculate arrowhead points
  const arrowPoint1X = endX - arrowLength * Math.cos(radians - arrowAngle);
  const arrowPoint1Y = endY + arrowLength * Math.sin(radians - arrowAngle);
  const arrowPoint2X = endX - arrowLength * Math.cos(radians + arrowAngle);
  const arrowPoint2Y = endY + arrowLength * Math.sin(radians + arrowAngle);

  // Label position (offset from end of arrow)
  const labelOffset = 18;
  const labelX = endX + labelOffset * Math.cos(radians);
  const labelY = endY - labelOffset * Math.sin(radians);

  return (
    <g>
      {/* Arrow line */}
      <line
        x1={x}
        y1={y}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Arrowhead */}
      <polygon
        points={`${endX},${endY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
        fill={color}
      />
      {/* Label */}
      {label && (
        <text
          x={labelX}
          y={labelY}
          fontSize="14"
          fontWeight="bold"
          fontStyle="italic"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/**
 * Angle Arc with degree label
 */
export const AngleArc: React.FC<{
  cx: number;
  cy: number;
  startAngle: number;
  endAngle: number;
  radius?: number;
  showLabel?: boolean;
}> = ({ cx, cy, startAngle, endAngle, radius = 25, showLabel = true }) => {
  // Convert to radians (SVG y-axis inverted)
  const startRad = (-startAngle * Math.PI) / 180;
  const endRad = (-endAngle * Math.PI) / 180;

  // Calculate arc endpoints
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  // Determine if we need large arc flag
  const angleDiff = Math.abs(endAngle - startAngle);
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  // Sweep direction
  const sweepFlag = endAngle > startAngle ? 0 : 1;

  // Label position (middle of arc)
  const midAngle = ((-startAngle - endAngle) / 2 * Math.PI) / 180;
  const labelRadius = radius + 12;
  const labelX = cx + labelRadius * Math.cos(midAngle);
  const labelY = cy + labelRadius * Math.sin(midAngle);

  return (
    <g>
      {/* Arc */}
      <path
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={1.5}
      />
      {/* Angle label */}
      {showLabel && (
        <text
          x={labelX}
          y={labelY}
          fontSize="11"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={STROKE_COLOR}
        >
          {Math.abs(endAngle - startAngle)}°
        </text>
      )}
    </g>
  );
};

/**
 * Object shape (rectangle, circle, or triangle)
 */
export const ObjectShape: React.FC<{
  x: number;
  y: number;
  shape: 'rectangle' | 'circle' | 'triangle' | 'irregular';
  width?: number;
  height?: number;
  label?: string;
  fill?: string;
}> = ({ x, y, shape, width = 60, height = 40, label, fill = 'white' }) => {
  const halfW = width / 2;
  const halfH = height / 2;

  switch (shape) {
    case 'circle':
      return (
        <g>
          <circle
            cx={x}
            cy={y}
            r={Math.min(halfW, halfH)}
            fill={fill}
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
          {label && (
            <text x={x} y={y + 4} fontSize="12" textAnchor="middle" fill={STROKE_COLOR}>
              {label}
            </text>
          )}
        </g>
      );

    case 'triangle':
      return (
        <g>
          <polygon
            points={`${x},${y - halfH} ${x - halfW},${y + halfH} ${x + halfW},${y + halfH}`}
            fill={fill}
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
          {label && (
            <text x={x} y={y + 8} fontSize="12" textAnchor="middle" fill={STROKE_COLOR}>
              {label}
            </text>
          )}
        </g>
      );

    case 'rectangle':
    default:
      return (
        <g>
          <rect
            x={x - halfW}
            y={y - halfH}
            width={width}
            height={height}
            fill={fill}
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
          {label && (
            <text x={x} y={y + 4} fontSize="12" textAnchor="middle" fill={STROKE_COLOR}>
              {label}
            </text>
          )}
        </g>
      );
  }
};

/**
 * Surface line (for friction problems)
 */
export const SurfaceLine: React.FC<{
  x: number;
  y: number;
  length: number;
  angle?: number;
  hasHatch?: boolean;
}> = ({ x, y, length, angle = 0, hasHatch = true }) => {
  const radians = (angle * Math.PI) / 180;
  const endX = x + length * Math.cos(radians);
  const endY = y + length * Math.sin(radians);

  // Generate hatch marks for ground
  const hatchMarks = [];
  if (hasHatch) {
    const hatchCount = Math.floor(length / 15);
    const hatchLength = 8;
    for (let i = 1; i <= hatchCount; i++) {
      const hx = x + (i * length / (hatchCount + 1)) * Math.cos(radians);
      const hy = y + (i * length / (hatchCount + 1)) * Math.sin(radians);
      // Hatch at 45 degrees below surface
      const hatchAngle = radians + Math.PI / 4 + Math.PI / 2;
      hatchMarks.push(
        <line
          key={i}
          x1={hx}
          y1={hy}
          x2={hx + hatchLength * Math.cos(hatchAngle)}
          y2={hy + hatchLength * Math.sin(hatchAngle)}
          stroke={STROKE_COLOR}
          strokeWidth={1}
        />
      );
    }
  }

  return (
    <g>
      {/* Main surface line */}
      <line
        x1={x}
        y1={y}
        x2={endX}
        y2={endY}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH + 1}
      />
      {/* Hatch marks */}
      {hatchMarks}
    </g>
  );
};

/**
 * Pivot point (triangle support)
 */
export const PivotPoint: React.FC<{
  x: number;
  y: number;
  size?: number;
}> = ({ x, y, size = 20 }) => (
  <g>
    <polygon
      points={`${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}`}
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Ground line */}
    <line
      x1={x - size}
      y1={y + size}
      x2={x + size}
      y2={y + size}
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
  </g>
);

/**
 * Spring symbol (coiled line)
 */
export const SpringSymbol: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  coils?: number;
}> = ({ x1, y1, x2, y2, coils = 6 }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Generate coil path
  const coilWidth = 10;
  const coilSegment = (length - 20) / (coils * 2);
  let pathD = `M ${x1} ${y1}`;

  // Start straight section
  pathD += ` l ${10 * Math.cos(angle)} ${10 * Math.sin(angle)}`;

  // Coils
  for (let i = 0; i < coils; i++) {
    const perpAngle = angle + Math.PI / 2;
    pathD += ` l ${coilSegment * Math.cos(angle) + coilWidth * Math.cos(perpAngle)} ${coilSegment * Math.sin(angle) + coilWidth * Math.sin(perpAngle)}`;
    pathD += ` l ${coilSegment * Math.cos(angle) - coilWidth * Math.cos(perpAngle)} ${coilSegment * Math.sin(angle) - coilWidth * Math.sin(perpAngle)}`;
  }

  // End straight section
  pathD += ` l ${10 * Math.cos(angle)} ${10 * Math.sin(angle)}`;

  return (
    <path
      d={pathD}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
  );
};

/**
 * Pulley symbol (circle with central dot)
 */
export const PulleySymbol: React.FC<{
  x: number;
  y: number;
  radius?: number;
}> = ({ x, y, radius = 15 }) => (
  <g>
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    <circle
      cx={x}
      cy={y}
      r={3}
      fill={STROKE_COLOR}
    />
  </g>
);

/**
 * Rope/String line
 */
export const RopeLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
}> = ({ x1, y1, x2, y2, dashed = false }) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={STROKE_COLOR}
    strokeWidth={STROKE_WIDTH}
    strokeDasharray={dashed ? '5,5' : undefined}
  />
);
