import React from 'react';

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 1.5;
const AXIS_STROKE_WIDTH = 2;
const GRID_COLOR = '#e5e7eb';

interface Position {
  x: number;
  y: number;
}

/**
 * Coordinate axes with arrows and labels
 */
export const CoordinateAxes: React.FC<{
  originX: number;
  originY: number;
  width: number;
  height: number;
  xLabel?: string;
  yLabel?: string;
  showArrows?: boolean;
}> = ({ originX, originY, width, height, xLabel = 'x', yLabel = 'y', showArrows = true }) => {
  const arrowSize = 8;
  const padding = 20;

  // Calculate axis endpoints
  const xAxisStart = padding;
  const xAxisEnd = width - padding;
  const yAxisStart = height - padding;
  const yAxisEnd = padding;

  return (
    <g>
      {/* X-axis */}
      <line
        x1={xAxisStart}
        y1={originY}
        x2={xAxisEnd}
        y2={originY}
        stroke={STROKE_COLOR}
        strokeWidth={AXIS_STROKE_WIDTH}
      />
      {/* X-axis arrow */}
      {showArrows && (
        <polygon
          points={`${xAxisEnd},${originY} ${xAxisEnd - arrowSize},${originY - arrowSize / 2} ${xAxisEnd - arrowSize},${originY + arrowSize / 2}`}
          fill={STROKE_COLOR}
        />
      )}
      {/* X-axis label */}
      <text
        x={xAxisEnd - 5}
        y={originY + 18}
        fontSize="14"
        fontStyle="italic"
        textAnchor="end"
        fill={STROKE_COLOR}
      >
        {xLabel}
      </text>

      {/* Y-axis */}
      <line
        x1={originX}
        y1={yAxisStart}
        x2={originX}
        y2={yAxisEnd}
        stroke={STROKE_COLOR}
        strokeWidth={AXIS_STROKE_WIDTH}
      />
      {/* Y-axis arrow */}
      {showArrows && (
        <polygon
          points={`${originX},${yAxisEnd} ${originX - arrowSize / 2},${yAxisEnd + arrowSize} ${originX + arrowSize / 2},${yAxisEnd + arrowSize}`}
          fill={STROKE_COLOR}
        />
      )}
      {/* Y-axis label */}
      <text
        x={originX - 10}
        y={yAxisEnd + 5}
        fontSize="14"
        fontStyle="italic"
        textAnchor="end"
        fill={STROKE_COLOR}
      >
        {yLabel}
      </text>

      {/* Origin label */}
      <text
        x={originX - 8}
        y={originY + 16}
        fontSize="12"
        textAnchor="end"
        fill={STROKE_COLOR}
      >
        O
      </text>
    </g>
  );
};

/**
 * Grid lines for coordinate system
 */
export const GridLines: React.FC<{
  originX: number;
  originY: number;
  width: number;
  height: number;
  spacing: number;
  showNumbers?: boolean;
}> = ({ originX, originY, width, height, spacing, showNumbers = true }) => {
  const padding = 20;
  const lines: React.ReactElement[] = [];
  const labels: React.ReactElement[] = [];

  // Vertical grid lines (and x-axis numbers)
  for (let x = originX + spacing; x < width - padding; x += spacing) {
    const gridNum = Math.round((x - originX) / spacing);
    lines.push(
      <line
        key={`vgrid-pos-${x}`}
        x1={x}
        y1={padding}
        x2={x}
        y2={height - padding}
        stroke={GRID_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers && gridNum !== 0) {
      labels.push(
        <text
          key={`xlabel-pos-${x}`}
          x={x}
          y={originY + 16}
          fontSize="10"
          textAnchor="middle"
          fill={STROKE_COLOR}
        >
          {gridNum}
        </text>
      );
    }
  }

  for (let x = originX - spacing; x > padding; x -= spacing) {
    const gridNum = Math.round((x - originX) / spacing);
    lines.push(
      <line
        key={`vgrid-neg-${x}`}
        x1={x}
        y1={padding}
        x2={x}
        y2={height - padding}
        stroke={GRID_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers && gridNum !== 0) {
      labels.push(
        <text
          key={`xlabel-neg-${x}`}
          x={x}
          y={originY + 16}
          fontSize="10"
          textAnchor="middle"
          fill={STROKE_COLOR}
        >
          {gridNum}
        </text>
      );
    }
  }

  // Horizontal grid lines (and y-axis numbers)
  for (let y = originY - spacing; y > padding; y -= spacing) {
    const gridNum = Math.round((originY - y) / spacing);
    lines.push(
      <line
        key={`hgrid-pos-${y}`}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke={GRID_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers && gridNum !== 0) {
      labels.push(
        <text
          key={`ylabel-pos-${y}`}
          x={originX - 8}
          y={y + 4}
          fontSize="10"
          textAnchor="end"
          fill={STROKE_COLOR}
        >
          {gridNum}
        </text>
      );
    }
  }

  for (let y = originY + spacing; y < height - padding; y += spacing) {
    const gridNum = Math.round((originY - y) / spacing);
    lines.push(
      <line
        key={`hgrid-neg-${y}`}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke={GRID_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers && gridNum !== 0) {
      labels.push(
        <text
          key={`ylabel-neg-${y}`}
          x={originX - 8}
          y={y + 4}
          fontSize="10"
          textAnchor="end"
          fill={STROKE_COLOR}
        >
          {gridNum}
        </text>
      );
    }
  }

  return (
    <g>
      {lines}
      {labels}
    </g>
  );
};

/**
 * Tick marks on axes
 */
export const TickMarks: React.FC<{
  originX: number;
  originY: number;
  width: number;
  height: number;
  spacing: number;
  showNumbers?: boolean;
}> = ({ originX, originY, width, height, spacing, showNumbers = true }) => {
  const padding = 20;
  const tickSize = 5;
  const ticks: React.ReactElement[] = [];
  const labels: React.ReactElement[] = [];

  // X-axis ticks
  for (let x = originX + spacing; x < width - padding; x += spacing) {
    const num = Math.round((x - originX) / spacing);
    ticks.push(
      <line
        key={`xtick-pos-${x}`}
        x1={x}
        y1={originY - tickSize}
        x2={x}
        y2={originY + tickSize}
        stroke={STROKE_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers) {
      labels.push(
        <text
          key={`xnum-pos-${x}`}
          x={x}
          y={originY + 16}
          fontSize="10"
          textAnchor="middle"
          fill={STROKE_COLOR}
        >
          {num}
        </text>
      );
    }
  }

  for (let x = originX - spacing; x > padding; x -= spacing) {
    const num = Math.round((x - originX) / spacing);
    ticks.push(
      <line
        key={`xtick-neg-${x}`}
        x1={x}
        y1={originY - tickSize}
        x2={x}
        y2={originY + tickSize}
        stroke={STROKE_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers) {
      labels.push(
        <text
          key={`xnum-neg-${x}`}
          x={x}
          y={originY + 16}
          fontSize="10"
          textAnchor="middle"
          fill={STROKE_COLOR}
        >
          {num}
        </text>
      );
    }
  }

  // Y-axis ticks
  for (let y = originY - spacing; y > padding; y -= spacing) {
    const num = Math.round((originY - y) / spacing);
    ticks.push(
      <line
        key={`ytick-pos-${y}`}
        x1={originX - tickSize}
        y1={y}
        x2={originX + tickSize}
        y2={y}
        stroke={STROKE_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers) {
      labels.push(
        <text
          key={`ynum-pos-${y}`}
          x={originX - 8}
          y={y + 4}
          fontSize="10"
          textAnchor="end"
          fill={STROKE_COLOR}
        >
          {num}
        </text>
      );
    }
  }

  for (let y = originY + spacing; y < height - padding; y += spacing) {
    const num = Math.round((originY - y) / spacing);
    ticks.push(
      <line
        key={`ytick-neg-${y}`}
        x1={originX - tickSize}
        y1={y}
        x2={originX + tickSize}
        y2={y}
        stroke={STROKE_COLOR}
        strokeWidth={1}
      />
    );
    if (showNumbers) {
      labels.push(
        <text
          key={`ynum-neg-${y}`}
          x={originX - 8}
          y={y + 4}
          fontSize="10"
          textAnchor="end"
          fill={STROKE_COLOR}
        >
          {num}
        </text>
      );
    }
  }

  return (
    <g>
      {ticks}
      {labels}
    </g>
  );
};

/**
 * Plot a point with optional label
 */
export const PlotPoint: React.FC<{
  x: number;
  y: number;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left';
  filled?: boolean;
  size?: number;
}> = ({ x, y, label, labelPosition = 'top-right', filled = true, size = 4 }) => {
  const getLabelOffset = () => {
    switch (labelPosition) {
      case 'top': return { dx: 0, dy: -10, anchor: 'middle' };
      case 'bottom': return { dx: 0, dy: 16, anchor: 'middle' };
      case 'left': return { dx: -10, dy: 4, anchor: 'end' };
      case 'right': return { dx: 10, dy: 4, anchor: 'start' };
      case 'top-right': return { dx: 8, dy: -6, anchor: 'start' };
      case 'top-left': return { dx: -8, dy: -6, anchor: 'end' };
      default: return { dx: 8, dy: -6, anchor: 'start' };
    }
  };

  const offset = getLabelOffset();

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={filled ? STROKE_COLOR : 'white'}
        stroke={STROKE_COLOR}
        strokeWidth={1.5}
      />
      {label && (
        <text
          x={x + offset.dx}
          y={y + offset.dy}
          fontSize="12"
          textAnchor={offset.anchor as any}
          fill={STROKE_COLOR}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/**
 * Draw a straight line between two points or extending to edges
 */
export const GraphLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  extendToEdge?: boolean;
  width?: number;
  height?: number;
}> = ({ x1, y1, x2, y2, dashed = false, extendToEdge = false, width, height }) => {
  let finalX1 = x1;
  let finalY1 = y1;
  let finalX2 = x2;
  let finalY2 = y2;

  // Extend line to edges if requested
  if (extendToEdge && width && height) {
    const padding = 20;
    const slope = (y2 - y1) / (x2 - x1);

    if (isFinite(slope)) {
      // Find intersections with boundaries
      // Left edge
      const yAtLeft = y1 + slope * (padding - x1);
      // Right edge
      const yAtRight = y1 + slope * (width - padding - x1);

      if (yAtLeft >= padding && yAtLeft <= height - padding) {
        finalX1 = padding;
        finalY1 = yAtLeft;
      }
      if (yAtRight >= padding && yAtRight <= height - padding) {
        finalX2 = width - padding;
        finalY2 = yAtRight;
      }
    }
  }

  return (
    <line
      x1={finalX1}
      y1={finalY1}
      x2={finalX2}
      y2={finalY2}
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={dashed ? '6,4' : undefined}
    />
  );
};

/**
 * Draw a curve through multiple points (smooth bezier)
 */
export const GraphCurve: React.FC<{
  points: Position[];
  dashed?: boolean;
  smooth?: boolean;
}> = ({ points, dashed = false, smooth = true }) => {
  if (points.length < 2) return null;

  let pathD: string;

  if (smooth && points.length > 2) {
    // Create smooth curve using quadratic bezier
    pathD = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];

      // Control point is the current point
      const cpX = curr.x;
      const cpY = curr.y;

      // End point is midway to next point
      const endX = (curr.x + next.x) / 2;
      const endY = (curr.y + next.y) / 2;

      if (i === 1) {
        pathD += ` Q ${cpX} ${cpY} ${endX} ${endY}`;
      } else {
        pathD += ` T ${endX} ${endY}`;
      }
    }

    // Final segment to last point
    const lastPoint = points[points.length - 1];
    pathD += ` T ${lastPoint.x} ${lastPoint.y}`;
  } else {
    // Simple polyline
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
  }

  return (
    <path
      d={pathD}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={dashed ? '6,4' : undefined}
    />
  );
};

/**
 * Draw a parabola y = ax² + bx + c
 */
export const Parabola: React.FC<{
  a: number;
  b: number;
  c: number;
  originX: number;
  originY: number;
  scale: number;
  xMin: number;
  xMax: number;
  dashed?: boolean;
}> = ({ a, b, c, originX, originY, scale, xMin, xMax, dashed = false }) => {
  const points: Position[] = [];
  const step = 0.1;

  for (let x = xMin; x <= xMax; x += step) {
    const y = a * x * x + b * x + c;
    points.push({
      x: originX + x * scale,
      y: originY - y * scale, // Y is inverted in SVG
    });
  }

  if (points.length < 2) return null;

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  return (
    <path
      d={pathD}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={dashed ? '6,4' : undefined}
    />
  );
};

/**
 * Draw a linear function y = mx + c
 */
export const LinearFunction: React.FC<{
  m: number; // slope
  c: number; // y-intercept
  originX: number;
  originY: number;
  scale: number;
  xMin: number;
  xMax: number;
  dashed?: boolean;
}> = ({ m, c, originX, originY, scale, xMin, xMax, dashed = false }) => {
  const x1 = xMin;
  const y1 = m * x1 + c;
  const x2 = xMax;
  const y2 = m * x2 + c;

  return (
    <line
      x1={originX + x1 * scale}
      y1={originY - y1 * scale}
      x2={originX + x2 * scale}
      y2={originY - y2 * scale}
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={dashed ? '6,4' : undefined}
    />
  );
};

/**
 * Draw an asymptote (dashed line)
 */
export const Asymptote: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}> = ({ x1, y1, x2, y2, label }) => (
  <g>
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={STROKE_COLOR}
      strokeWidth={1}
      strokeDasharray="8,4"
    />
    {label && (
      <text
        x={(x1 + x2) / 2 + 5}
        y={(y1 + y2) / 2 - 5}
        fontSize="10"
        fontStyle="italic"
        fill={STROKE_COLOR}
      >
        {label}
      </text>
    )}
  </g>
);

/**
 * Draw a shaded region (for inequalities)
 */
export const ShadedRegion: React.FC<{
  points: Position[];
  pattern?: 'solid' | 'lines' | 'dots';
  opacity?: number;
}> = ({ points, pattern = 'lines', opacity = 0.2 }) => {
  if (points.length < 3) return null;

  const pathD = `M ${points[0].x} ${points[0].y} ` +
    points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
    ' Z';

  const patternId = `pattern-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <g>
      {pattern === 'lines' && (
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke={STROKE_COLOR}
              strokeWidth="1"
            />
          </pattern>
        </defs>
      )}
      {pattern === 'dots' && (
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
          >
            <circle cx="5" cy="5" r="1.5" fill={STROKE_COLOR} />
          </pattern>
        </defs>
      )}
      <path
        d={pathD}
        fill={pattern === 'solid' ? STROKE_COLOR : `url(#${patternId})`}
        fillOpacity={pattern === 'solid' ? opacity : 1}
        stroke="none"
      />
    </g>
  );
};

/**
 * Draw an arrow (for vectors on graph)
 */
export const GraphArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}> = ({ x1, y1, x2, y2, label }) => {
  const arrowSize = 8;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <polygon
        points={`
          ${x2},${y2}
          ${x2 - arrowSize * Math.cos(angle - 0.4)},${y2 - arrowSize * Math.sin(angle - 0.4)}
          ${x2 - arrowSize * Math.cos(angle + 0.4)},${y2 - arrowSize * Math.sin(angle + 0.4)}
        `}
        fill={STROKE_COLOR}
      />
      {label && (
        <text
          x={(x1 + x2) / 2 + 8}
          y={(y1 + y2) / 2 - 5}
          fontSize="12"
          fill={STROKE_COLOR}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/**
 * Draw a circle on the graph
 */
export const GraphCircle: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  dashed?: boolean;
  filled?: boolean;
}> = ({ cx, cy, radius, dashed = false, filled = false }) => (
  <circle
    cx={cx}
    cy={cy}
    r={radius}
    fill={filled ? `${STROKE_COLOR}20` : 'none'}
    stroke={STROKE_COLOR}
    strokeWidth={STROKE_WIDTH}
    strokeDasharray={dashed ? '6,4' : undefined}
  />
);

/**
 * Draw intercept markers (small ticks at intercept points)
 */
export const InterceptMarker: React.FC<{
  x: number;
  y: number;
  axis: 'x' | 'y';
  label?: string;
}> = ({ x, y, axis, label }) => {
  const tickSize = 4;

  return (
    <g>
      {axis === 'x' ? (
        <line
          x1={x}
          y1={y - tickSize}
          x2={x}
          y2={y + tickSize}
          stroke={STROKE_COLOR}
          strokeWidth={1.5}
        />
      ) : (
        <line
          x1={x - tickSize}
          y1={y}
          x2={x + tickSize}
          y2={y}
          stroke={STROKE_COLOR}
          strokeWidth={1.5}
        />
      )}
      {label && (
        <text
          x={axis === 'x' ? x : x - 10}
          y={axis === 'x' ? y + 14 : y + 4}
          fontSize="10"
          textAnchor={axis === 'x' ? 'middle' : 'end'}
          fill={STROKE_COLOR}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/**
 * Equation label (for displaying function equation on graph)
 */
export const EquationLabel: React.FC<{
  x: number;
  y: number;
  equation: string;
}> = ({ x, y, equation }) => (
  <text
    x={x}
    y={y}
    fontSize="12"
    fontStyle="italic"
    fill={STROKE_COLOR}
  >
    {equation}
  </text>
);
