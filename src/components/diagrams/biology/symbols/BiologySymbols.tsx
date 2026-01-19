import React from 'react';

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 2;

/**
 * Cell membrane (double line border)
 */
export const CellMembrane: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: 'rectangular' | 'circular' | 'irregular';
}> = ({ x, y, width, height, shape = 'rectangular' }) => {
  if (shape === 'circular') {
    const rx = width / 2;
    const ry = height / 2;
    return (
      <g>
        <ellipse
          cx={x + rx}
          cy={y + ry}
          rx={rx}
          ry={ry}
          fill="white"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
        />
        <ellipse
          cx={x + rx}
          cy={y + ry}
          rx={rx - 4}
          ry={ry - 4}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={1}
          strokeDasharray="3,2"
        />
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="white"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        rx="8"
        ry="8"
      />
      <rect
        x={x + 4}
        y={y + 4}
        width={width - 8}
        height={height - 8}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={1}
        strokeDasharray="3,2"
        rx="6"
        ry="6"
      />
    </g>
  );
};

/**
 * Nucleus (double circle with nucleolus)
 */
export const NucleusSymbol: React.FC<{
  x: number;
  y: number;
  radius?: number;
  showNucleolus?: boolean;
}> = ({ x, y, radius = 25, showNucleolus = true }) => (
  <g>
    {/* Outer membrane */}
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Inner membrane */}
    <circle
      cx={x}
      cy={y}
      r={radius - 4}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={1}
      strokeDasharray="2,2"
    />
    {/* Nucleolus */}
    {showNucleolus && (
      <circle
        cx={x + 5}
        cy={y - 3}
        r={radius / 3}
        fill="#666666"
        stroke={STROKE_COLOR}
        strokeWidth={1}
      />
    )}
    {/* Label */}
    <text x={x} y={y + radius + 16} fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>
      Nucleus
    </text>
  </g>
);

/**
 * Mitochondria (elongated with inner folds)
 */
export const MitochondriaSymbol: React.FC<{
  x: number;
  y: number;
  width?: number;
  height?: number;
}> = ({ x, y, width = 50, height = 25 }) => (
  <g>
    {/* Outer membrane */}
    <ellipse
      cx={x}
      cy={y}
      rx={width / 2}
      ry={height / 2}
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Inner folds (cristae) */}
    <path
      d={`M ${x - width / 3} ${y - height / 3}
          Q ${x - width / 6} ${y + height / 4} ${x - width / 3} ${y + height / 3}`}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={1.5}
    />
    <path
      d={`M ${x} ${y - height / 3}
          Q ${x + width / 8} ${y + height / 4} ${x} ${y + height / 3}`}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={1.5}
    />
    <path
      d={`M ${x + width / 3} ${y - height / 3}
          Q ${x + width / 5} ${y + height / 4} ${x + width / 3} ${y + height / 3}`}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={1.5}
    />
  </g>
);

/**
 * Chloroplast (elongated with stacked thylakoids)
 */
export const ChloroplastSymbol: React.FC<{
  x: number;
  y: number;
  width?: number;
  height?: number;
}> = ({ x, y, width = 60, height = 30 }) => (
  <g>
    {/* Outer membrane */}
    <ellipse
      cx={x}
      cy={y}
      rx={width / 2}
      ry={height / 2}
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Thylakoid stacks (grana) */}
    {[-15, 0, 15].map((offset, i) => (
      <g key={i}>
        {[0, 6, 12].map((yOff, j) => (
          <ellipse
            key={j}
            cx={x + offset}
            cy={y - 6 + yOff}
            rx="8"
            ry="3"
            fill="none"
            stroke={STROKE_COLOR}
            strokeWidth={1}
          />
        ))}
      </g>
    ))}
  </g>
);

/**
 * Vacuole (large rounded shape)
 */
export const VacuoleSymbol: React.FC<{
  x: number;
  y: number;
  width?: number;
  height?: number;
}> = ({ x, y, width = 40, height = 40 }) => (
  <ellipse
    cx={x}
    cy={y}
    rx={width / 2}
    ry={height / 2}
    fill="white"
    stroke={STROKE_COLOR}
    strokeWidth={STROKE_WIDTH}
  />
);

/**
 * Ribosome (small dot)
 */
export const RibosomeSymbol: React.FC<{
  x: number;
  y: number;
}> = ({ x, y }) => (
  <circle cx={x} cy={y} r="3" fill={STROKE_COLOR} />
);

/**
 * Simple organism/entity box with label
 */
export const OrganismBox: React.FC<{
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
}> = ({ x, y, width = 80, height = 40, label }) => (
  <g>
    <rect
      x={x - width / 2}
      y={y - height / 2}
      width={width}
      height={height}
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      rx="4"
      ry="4"
    />
    <text
      x={x}
      y={y + 4}
      fontSize="12"
      textAnchor="middle"
      fill={STROKE_COLOR}
    >
      {label}
    </text>
  </g>
);

/**
 * Arrow for process flows
 */
export const ProcessArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  curved?: boolean;
}> = ({ x1, y1, x2, y2, label, curved = false }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const arrowSize = 10;

  let path: string;
  let labelX: number;
  let labelY: number;

  if (curved) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 30; // Curve upward
    path = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
    labelX = midX;
    labelY = midY - 10;
  } else {
    path = `M ${x1} ${y1} L ${x2} ${y2}`;
    labelX = (x1 + x2) / 2;
    labelY = (y1 + y2) / 2 - 10;
  }

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      {/* Arrowhead */}
      <polygon
        points={`
          ${x2},${y2}
          ${x2 - arrowSize * Math.cos(angle - 0.4)},${y2 - arrowSize * Math.sin(angle - 0.4)}
          ${x2 - arrowSize * Math.cos(angle + 0.4)},${y2 - arrowSize * Math.sin(angle + 0.4)}
        `}
        fill={STROKE_COLOR}
      />
      {/* Label */}
      {label && (
        <text
          x={labelX}
          y={labelY}
          fontSize="11"
          textAnchor="middle"
          fill={STROKE_COLOR}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/**
 * Label box (rounded rectangle with text)
 */
export const LabelBox: React.FC<{
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
}> = ({ x, y, text, width, height }) => {
  // Calculate dimensions based on text if not provided
  const textLength = text.length * 7;
  const boxWidth = width || Math.max(textLength + 20, 60);
  const boxHeight = height || 30;

  return (
    <g>
      <rect
        x={x - boxWidth / 2}
        y={y - boxHeight / 2}
        width={boxWidth}
        height={boxHeight}
        fill="white"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        rx="6"
        ry="6"
      />
      <text
        x={x}
        y={y + 4}
        fontSize="12"
        textAnchor="middle"
        fill={STROKE_COLOR}
      >
        {text}
      </text>
    </g>
  );
};
