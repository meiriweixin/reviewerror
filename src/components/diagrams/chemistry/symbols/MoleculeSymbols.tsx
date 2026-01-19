import React from 'react';

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 2;

/**
 * Atom symbol with element label
 */
export const AtomSymbol: React.FC<{
  x: number;
  y: number;
  symbol: string;
  charge?: number;
  showCircle?: boolean;
}> = ({ x, y, symbol, charge, showCircle = false }) => (
  <g>
    {showCircle && (
      <circle
        cx={x}
        cy={y}
        r="16"
        fill="white"
        stroke={STROKE_COLOR}
        strokeWidth={1}
      />
    )}
    <text
      x={x}
      y={y + 5}
      fontSize="16"
      fontWeight="bold"
      textAnchor="middle"
      fill={STROKE_COLOR}
    >
      {symbol}
    </text>
    {charge !== undefined && charge !== 0 && (
      <text
        x={x + 12}
        y={y - 6}
        fontSize="10"
        textAnchor="start"
        fill={STROKE_COLOR}
      >
        {charge > 0 ? (charge === 1 ? '+' : `${charge}+`) : (charge === -1 ? '−' : `${Math.abs(charge)}−`)}
      </text>
    )}
  </g>
);

/**
 * Single bond line
 */
export const SingleBond: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> = ({ x1, y1, x2, y2 }) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={STROKE_COLOR}
    strokeWidth={STROKE_WIDTH}
  />
);

/**
 * Double bond (two parallel lines)
 */
export const DoubleBond: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> = ({ x1, y1, x2, y2 }) => {
  // Calculate perpendicular offset
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const offsetX = (-dy / length) * 3;
  const offsetY = (dx / length) * 3;

  return (
    <g>
      <line
        x1={x1 + offsetX}
        y1={y1 + offsetY}
        x2={x2 + offsetX}
        y2={y2 + offsetY}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1={x1 - offsetX}
        y1={y1 - offsetY}
        x2={x2 - offsetX}
        y2={y2 - offsetY}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
    </g>
  );
};

/**
 * Triple bond (three parallel lines)
 */
export const TripleBond: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> = ({ x1, y1, x2, y2 }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const offsetX = (-dy / length) * 4;
  const offsetY = (dx / length) * 4;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <line
        x1={x1 + offsetX}
        y1={y1 + offsetY}
        x2={x2 + offsetX}
        y2={y2 + offsetY}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1={x1 - offsetX}
        y1={y1 - offsetY}
        x2={x2 - offsetX}
        y2={y2 - offsetY}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
    </g>
  );
};

/**
 * Dashed bond (for 3D representation - going back)
 */
export const DashedBond: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> = ({ x1, y1, x2, y2 }) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={STROKE_COLOR}
    strokeWidth={STROKE_WIDTH}
    strokeDasharray="4,3"
  />
);

/**
 * Wedge bond (for 3D representation - coming forward)
 */
export const WedgeBond: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> = ({ x1, y1, x2, y2 }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const offsetX = (-dy / length) * 6;
  const offsetY = (dx / length) * 6;

  return (
    <polygon
      points={`${x1},${y1} ${x2 + offsetX},${y2 + offsetY} ${x2 - offsetX},${y2 - offsetY}`}
      fill={STROKE_COLOR}
      stroke={STROKE_COLOR}
      strokeWidth={1}
    />
  );
};

/**
 * Lone pair (two dots)
 */
export const LonePair: React.FC<{
  x: number;
  y: number;
  direction: number; // degrees
}> = ({ x, y, direction }) => {
  const radians = (direction * Math.PI) / 180;
  const distance = 12;
  const dotSpacing = 6;

  const centerX = x + distance * Math.cos(radians);
  const centerY = y - distance * Math.sin(radians);

  const perpX = Math.cos(radians + Math.PI / 2) * dotSpacing / 2;
  const perpY = -Math.sin(radians + Math.PI / 2) * dotSpacing / 2;

  return (
    <g>
      <circle cx={centerX + perpX} cy={centerY + perpY} r="2" fill={STROKE_COLOR} />
      <circle cx={centerX - perpX} cy={centerY - perpY} r="2" fill={STROKE_COLOR} />
    </g>
  );
};

/**
 * Electron dot
 */
export const ElectronDot: React.FC<{
  x: number;
  y: number;
}> = ({ x, y }) => (
  <circle cx={x} cy={y} r="2.5" fill={STROKE_COLOR} />
);

/**
 * Bracket for ions [...]
 */
export const IonBracket: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  charge: number;
}> = ({ x, y, width, height, charge }) => (
  <g>
    {/* Left bracket */}
    <path
      d={`M ${x + 8} ${y - height / 2} L ${x} ${y - height / 2} L ${x} ${y + height / 2} L ${x + 8} ${y + height / 2}`}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Right bracket */}
    <path
      d={`M ${x + width - 8} ${y - height / 2} L ${x + width} ${y - height / 2} L ${x + width} ${y + height / 2} L ${x + width - 8} ${y + height / 2}`}
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Charge */}
    <text
      x={x + width + 8}
      y={y - height / 2 + 8}
      fontSize="12"
      fill={STROKE_COLOR}
    >
      {charge > 0 ? (charge === 1 ? '+' : `${charge}+`) : (charge === -1 ? '−' : `${Math.abs(charge)}−`)}
    </text>
  </g>
);

/**
 * Reaction arrow
 */
export const ReactionArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  reversible?: boolean;
  label?: string;
}> = ({ x1, y1, x2, y2, reversible = false, label }) => {
  const arrowSize = 8;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);

  return (
    <g>
      {/* Main line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2 - arrowSize * Math.cos(angle)}
        y2={y2 - arrowSize * Math.sin(angle)}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      {/* Forward arrow */}
      <polygon
        points={`
          ${x2},${y2}
          ${x2 - arrowSize * Math.cos(angle - 0.4)},${y2 - arrowSize * Math.sin(angle - 0.4)}
          ${x2 - arrowSize * Math.cos(angle + 0.4)},${y2 - arrowSize * Math.sin(angle + 0.4)}
        `}
        fill={STROKE_COLOR}
      />
      {/* Reverse arrow for equilibrium */}
      {reversible && (
        <>
          <line
            x1={x1 + 4}
            y1={y1 + 8}
            x2={x2 - arrowSize * Math.cos(angle) + 4}
            y2={y2 - arrowSize * Math.sin(angle) + 8}
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
          <polygon
            points={`
              ${x1 + 4},${y1 + 8}
              ${x1 + 4 + arrowSize * Math.cos(angle - 0.4)},${y1 + 8 + arrowSize * Math.sin(angle - 0.4)}
              ${x1 + 4 + arrowSize * Math.cos(angle + 0.4)},${y1 + 8 + arrowSize * Math.sin(angle + 0.4)}
            `}
            fill={STROKE_COLOR}
          />
        </>
      )}
      {/* Label */}
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={y1 - 10}
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
