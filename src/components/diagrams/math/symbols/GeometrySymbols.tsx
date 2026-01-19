import React from 'react';

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 2;

/**
 * Point with label
 */
export const PointSymbol: React.FC<{
  x: number;
  y: number;
  label?: string;
  showDot?: boolean;
}> = ({ x, y, label, showDot = true }) => (
  <g>
    {showDot && <circle cx={x} cy={y} r="3" fill={STROKE_COLOR} />}
    {label && (
      <text
        x={x + 8}
        y={y - 8}
        fontSize="14"
        fontStyle="italic"
        fill={STROKE_COLOR}
      >
        {label}
      </text>
    )}
  </g>
);

/**
 * Line segment between two points
 */
export const SegmentLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  showMeasurement?: string;
}> = ({ x1, y1, x2, y2, dashed = false, showMeasurement }) => (
  <g>
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={dashed ? '8,4' : undefined}
    />
    {showMeasurement && (
      <text
        x={(x1 + x2) / 2}
        y={(y1 + y2) / 2 - 8}
        fontSize="12"
        textAnchor="middle"
        fill={STROKE_COLOR}
      >
        {showMeasurement}
      </text>
    )}
  </g>
);

/**
 * Ray (line with one arrow endpoint)
 */
export const RayLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> = ({ x1, y1, x2, y2 }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const arrowSize = 10;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <polygon
        points={`
          ${x2},${y2}
          ${x2 - arrowSize * Math.cos(angle - 0.4)},${y2 - arrowSize * Math.sin(angle - 0.4)}
          ${x2 - arrowSize * Math.cos(angle + 0.4)},${y2 - arrowSize * Math.sin(angle + 0.4)}
        `}
        fill={STROKE_COLOR}
      />
    </g>
  );
};

/**
 * Infinite line (with arrows on both ends)
 */
export const InfiniteLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> = ({ x1, y1, x2, y2 }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const arrowSize = 8;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      {/* Arrow at end */}
      <polygon
        points={`
          ${x2},${y2}
          ${x2 - arrowSize * Math.cos(angle - 0.4)},${y2 - arrowSize * Math.sin(angle - 0.4)}
          ${x2 - arrowSize * Math.cos(angle + 0.4)},${y2 - arrowSize * Math.sin(angle + 0.4)}
        `}
        fill={STROKE_COLOR}
      />
      {/* Arrow at start */}
      <polygon
        points={`
          ${x1},${y1}
          ${x1 + arrowSize * Math.cos(angle - 0.4)},${y1 + arrowSize * Math.sin(angle - 0.4)}
          ${x1 + arrowSize * Math.cos(angle + 0.4)},${y1 + arrowSize * Math.sin(angle + 0.4)}
        `}
        fill={STROKE_COLOR}
      />
    </g>
  );
};

/**
 * Angle arc with degree marking
 */
export const AngleSymbol: React.FC<{
  vertex: { x: number; y: number };
  ray1End: { x: number; y: number };
  ray2End: { x: number; y: number };
  angleDegrees?: number;
  radius?: number;
  showRightAngle?: boolean;
}> = ({ vertex, ray1End, ray2End, angleDegrees, radius = 25, showRightAngle = false }) => {
  // Calculate angles
  const angle1 = Math.atan2(ray1End.y - vertex.y, ray1End.x - vertex.x);
  const angle2 = Math.atan2(ray2End.y - vertex.y, ray2End.x - vertex.x);

  // For right angle, draw a small square
  if (showRightAngle || angleDegrees === 90) {
    const size = 15;
    const midAngle = (angle1 + angle2) / 2;
    const cos1 = Math.cos(angle1);
    const sin1 = Math.sin(angle1);
    const cos2 = Math.cos(angle2);
    const sin2 = Math.sin(angle2);

    return (
      <g>
        <path
          d={`M ${vertex.x + size * cos1} ${vertex.y + size * sin1}
              L ${vertex.x + size * cos1 + size * cos2} ${vertex.y + size * sin1 + size * sin2}
              L ${vertex.x + size * cos2} ${vertex.y + size * sin2}`}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={1.5}
        />
      </g>
    );
  }

  // Calculate arc path
  const startX = vertex.x + radius * Math.cos(angle1);
  const startY = vertex.y + radius * Math.sin(angle1);
  const endX = vertex.x + radius * Math.cos(angle2);
  const endY = vertex.y + radius * Math.sin(angle2);

  // Determine arc sweep
  let angleDiff = angle2 - angle1;
  if (angleDiff < 0) angleDiff += 2 * Math.PI;
  const largeArc = angleDiff > Math.PI ? 1 : 0;

  // Label position
  const midAngle = angle1 + angleDiff / 2;
  const labelRadius = radius + 15;
  const labelX = vertex.x + labelRadius * Math.cos(midAngle);
  const labelY = vertex.y + labelRadius * Math.sin(midAngle);

  return (
    <g>
      <path
        d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={1.5}
      />
      {angleDegrees !== undefined && (
        <text
          x={labelX}
          y={labelY + 4}
          fontSize="12"
          textAnchor="middle"
          fill={STROKE_COLOR}
        >
          {angleDegrees}°
        </text>
      )}
    </g>
  );
};

/**
 * Circle
 */
export const CircleShape: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  dashed?: boolean;
  showCenter?: boolean;
  label?: string;
}> = ({ cx, cy, radius, dashed = false, showCenter = false, label }) => (
  <g>
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={dashed ? '8,4' : undefined}
    />
    {showCenter && <circle cx={cx} cy={cy} r="3" fill={STROKE_COLOR} />}
    {label && (
      <text x={cx + 8} y={cy - 8} fontSize="14" fontStyle="italic" fill={STROKE_COLOR}>
        {label}
      </text>
    )}
  </g>
);

/**
 * Arc (portion of circle)
 */
export const ArcShape: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}> = ({ cx, cy, radius, startAngle, endAngle }) => {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return (
    <path
      d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
  );
};

/**
 * Triangle (given three vertices)
 */
export const TriangleShape: React.FC<{
  vertices: Array<{ x: number; y: number }>;
  labels?: string[];
  showVertices?: boolean;
}> = ({ vertices, labels, showVertices = true }) => {
  if (vertices.length !== 3) return null;

  const [A, B, C] = vertices;

  return (
    <g>
      <polygon
        points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      {showVertices && vertices.map((v, i) => (
        <g key={i}>
          <circle cx={v.x} cy={v.y} r="3" fill={STROKE_COLOR} />
          {labels && labels[i] && (
            <text
              x={v.x + (v.x < (A.x + B.x + C.x) / 3 ? -12 : 8)}
              y={v.y + (v.y < (A.y + B.y + C.y) / 3 ? -8 : 16)}
              fontSize="14"
              fontStyle="italic"
              fill={STROKE_COLOR}
            >
              {labels[i]}
            </text>
          )}
        </g>
      ))}
    </g>
  );
};

/**
 * Rectangle
 */
export const RectangleShape: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  labels?: { corners?: string[]; sides?: string[] };
}> = ({ x, y, width, height, labels }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Corner labels */}
    {labels?.corners && labels.corners.map((label, i) => {
      const positions = [
        { x: x - 12, y: y - 8 },
        { x: x + width + 8, y: y - 8 },
        { x: x + width + 8, y: y + height + 16 },
        { x: x - 12, y: y + height + 16 },
      ];
      return (
        <text
          key={i}
          x={positions[i].x}
          y={positions[i].y}
          fontSize="14"
          fontStyle="italic"
          fill={STROKE_COLOR}
        >
          {label}
        </text>
      );
    })}
  </g>
);

/**
 * Parallel lines mark (small arrows on lines)
 */
export const ParallelMark: React.FC<{
  x: number;
  y: number;
  angle: number;
  count?: number;
}> = ({ x, y, angle, count = 1 }) => {
  const marks = [];
  const spacing = 4;
  const size = 6;
  const radians = (angle * Math.PI) / 180;

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spacing;
    const mx = x + offset * Math.cos(radians + Math.PI / 2);
    const my = y + offset * Math.sin(radians + Math.PI / 2);

    marks.push(
      <path
        key={i}
        d={`M ${mx - size * Math.cos(radians - 0.5)} ${my - size * Math.sin(radians - 0.5)}
            L ${mx} ${my}
            L ${mx - size * Math.cos(radians + 0.5)} ${my - size * Math.sin(radians + 0.5)}`}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={1.5}
      />
    );
  }

  return <g>{marks}</g>;
};

/**
 * Equal length mark (tick marks on segments)
 */
export const EqualMark: React.FC<{
  x: number;
  y: number;
  angle: number;
  count?: number;
}> = ({ x, y, angle, count = 1 }) => {
  const marks = [];
  const spacing = 4;
  const size = 8;
  const perpAngle = angle + 90;
  const perpRad = (perpAngle * Math.PI) / 180;
  const lineRad = (angle * Math.PI) / 180;

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spacing;
    const mx = x + offset * Math.cos(lineRad);
    const my = y + offset * Math.sin(lineRad);

    marks.push(
      <line
        key={i}
        x1={mx - size / 2 * Math.cos(perpRad)}
        y1={my - size / 2 * Math.sin(perpRad)}
        x2={mx + size / 2 * Math.cos(perpRad)}
        y2={my + size / 2 * Math.sin(perpRad)}
        stroke={STROKE_COLOR}
        strokeWidth={1.5}
      />
    );
  }

  return <g>{marks}</g>;
};

/**
 * Perpendicular mark (small square at intersection)
 */
export const PerpendicularMark: React.FC<{
  x: number;
  y: number;
  angle?: number;
  size?: number;
}> = ({ x, y, angle = 0, size = 10 }) => {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return (
    <path
      d={`M ${x + size * cos} ${y + size * sin}
          L ${x + size * cos - size * sin} ${y + size * sin + size * cos}
          L ${x - size * sin} ${y + size * cos}`}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={1.5}
    />
  );
};
