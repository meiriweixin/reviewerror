import React from 'react';
import { SymbolProps } from '../../../../types/diagram';

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 2;

/**
 * Battery Symbol - Two parallel lines (long and short)
 * Standard exam paper symbol
 */
export const BatterySymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, value, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-25" y1="0" x2="-8" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="8" y1="0" x2="25" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Long line (positive) */}
    <line x1="-8" y1="-14" x2="-8" y2="14" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Short line (negative) */}
    <line x1="8" y1="-8" x2="8" y2="8" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH + 1} />
    {/* + and - signs */}
    <text x="-14" y="-8" fontSize="10" textAnchor="middle" fill={STROKE_COLOR}>+</text>
    <text x="14" y="-8" fontSize="10" textAnchor="middle" fill={STROKE_COLOR}>−</text>
    {/* Value label */}
    {value && (
      <text x="0" y="28" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{value}</text>
    )}
    {label && (
      <text x="0" y="-22" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Cell Symbol - Single cell (one long, one short line)
 */
export const CellSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, value, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    <line x1="-20" y1="0" x2="-4" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="4" y1="0" x2="20" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="-4" y1="-12" x2="-4" y2="12" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="4" y1="-6" x2="4" y2="6" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH + 1} />
    {value && (
      <text x="0" y="24" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{value}</text>
    )}
    {label && (
      <text x="0" y="-18" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Bulb/Lamp Symbol - Circle with X inside
 * Standard exam paper symbol
 */
export const BulbSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-30" y1="0" x2="-14" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="14" y1="0" x2="30" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Circle */}
    <circle cx="0" cy="0" r="14" fill="white" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* X inside */}
    <line x1="-9" y1="-9" x2="9" y2="9" stroke={STROKE_COLOR} strokeWidth={1.5} />
    <line x1="9" y1="-9" x2="-9" y2="9" stroke={STROKE_COLOR} strokeWidth={1.5} />
    {/* Label */}
    {label && (
      <text x="0" y="30" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Resistor Symbol - Zigzag line
 * Standard exam paper symbol
 */
export const ResistorSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, value, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-35" y1="0" x2="-20" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="20" y1="0" x2="35" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Zigzag */}
    <polyline
      points="-20,0 -16,-8 -8,8 0,-8 8,8 16,-8 20,0"
      fill="none"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeLinejoin="round"
    />
    {/* Value label */}
    {value && (
      <text x="0" y="22" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{value}</text>
    )}
    {label && (
      <text x="0" y="-16" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Switch Symbol - Open or closed connection
 */
export const SwitchSymbol: React.FC<SymbolProps & { state?: 'open' | 'closed' }> = ({
  x, y, rotation = 0, state = 'open', label
}) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-30" y1="0" x2="-12" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="12" y1="0" x2="30" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Contact points */}
    <circle cx="-12" cy="0" r="3" fill={STROKE_COLOR} />
    <circle cx="12" cy="0" r="3" fill="white" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Switch lever */}
    {state === 'open' ? (
      <line x1="-9" y1="0" x2="9" y2="-14" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    ) : (
      <line x1="-9" y1="0" x2="9" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    )}
    {/* Label */}
    {label && (
      <text x="0" y="22" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Ammeter Symbol - Circle with A
 */
export const AmmeterSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-30" y1="0" x2="-14" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="14" y1="0" x2="30" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Circle */}
    <circle cx="0" cy="0" r="14" fill="white" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* A letter */}
    <text x="0" y="5" fontSize="14" fontWeight="bold" textAnchor="middle" fill={STROKE_COLOR}>A</text>
    {/* Label */}
    {label && (
      <text x="0" y="30" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Voltmeter Symbol - Circle with V
 */
export const VoltmeterSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-30" y1="0" x2="-14" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="14" y1="0" x2="30" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Circle */}
    <circle cx="0" cy="0" r="14" fill="white" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* V letter */}
    <text x="0" y="5" fontSize="14" fontWeight="bold" textAnchor="middle" fill={STROKE_COLOR}>V</text>
    {/* Label */}
    {label && (
      <text x="0" y="30" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Capacitor Symbol - Two parallel lines with gap
 */
export const CapacitorSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, value, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-25" y1="0" x2="-4" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="4" y1="0" x2="25" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Plates */}
    <line x1="-4" y1="-12" x2="-4" y2="12" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="4" y1="-12" x2="4" y2="12" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Value */}
    {value && (
      <text x="0" y="26" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{value}</text>
    )}
    {label && (
      <text x="0" y="-18" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Diode Symbol - Triangle with line
 */
export const DiodeSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-25" y1="0" x2="-10" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="10" y1="0" x2="25" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Triangle */}
    <polygon
      points="-10,0 10,-10 10,10"
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Cathode line */}
    <line x1="10" y1="-10" x2="10" y2="10" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Label */}
    {label && (
      <text x="0" y="24" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * LED Symbol - Diode with arrows
 */
export const LEDSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-25" y1="0" x2="-10" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="10" y1="0" x2="25" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Triangle */}
    <polygon
      points="-10,0 10,-10 10,10"
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    {/* Cathode line */}
    <line x1="10" y1="-10" x2="10" y2="10" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Light arrows */}
    <line x1="4" y1="-14" x2="10" y2="-20" stroke={STROKE_COLOR} strokeWidth={1.5} />
    <line x1="10" y1="-20" x2="8" y2="-16" stroke={STROKE_COLOR} strokeWidth={1.5} />
    <line x1="10" y1="-20" x2="6" y2="-18" stroke={STROKE_COLOR} strokeWidth={1.5} />
    <line x1="-2" y1="-16" x2="4" y2="-22" stroke={STROKE_COLOR} strokeWidth={1.5} />
    <line x1="4" y1="-22" x2="2" y2="-18" stroke={STROKE_COLOR} strokeWidth={1.5} />
    <line x1="4" y1="-22" x2="0" y2="-20" stroke={STROKE_COLOR} strokeWidth={1.5} />
    {/* Label */}
    {label && (
      <text x="0" y="24" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Motor Symbol - Circle with M
 */
export const MotorSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-30" y1="0" x2="-14" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="14" y1="0" x2="30" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Circle */}
    <circle cx="0" cy="0" r="14" fill="white" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* M letter */}
    <text x="0" y="5" fontSize="14" fontWeight="bold" textAnchor="middle" fill={STROKE_COLOR}>M</text>
    {/* Label */}
    {label && (
      <text x="0" y="30" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Bell Symbol - Semicircle bell shape
 */
export const BellSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-25" y1="0" x2="-12" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="12" y1="0" x2="25" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Bell shape */}
    <path
      d="M -12 0 Q -12 -16 0 -16 Q 12 -16 12 0"
      fill="white"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
    <line x1="-12" y1="0" x2="12" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Clapper */}
    <circle cx="0" cy="-4" r="3" fill={STROKE_COLOR} />
    {/* Label */}
    {label && (
      <text x="0" y="20" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Fuse Symbol - Rectangle with wire through
 */
export const FuseSymbol: React.FC<SymbolProps> = ({ x, y, rotation = 0, value, label }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
    {/* Connection wires */}
    <line x1="-30" y1="0" x2="-15" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    <line x1="15" y1="0" x2="30" y2="0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Rectangle */}
    <rect x="-15" y="-8" width="30" height="16" fill="white" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    {/* Wire through */}
    <line x1="-15" y1="0" x2="15" y2="0" stroke={STROKE_COLOR} strokeWidth={1} />
    {/* Value */}
    {value && (
      <text x="0" y="24" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{value}</text>
    )}
    {label && (
      <text x="0" y="-16" fontSize="11" textAnchor="middle" fill={STROKE_COLOR}>{label}</text>
    )}
  </g>
);

/**
 * Junction/Node Symbol - Filled circle for wire connections
 */
export const JunctionSymbol: React.FC<SymbolProps> = ({ x, y }) => (
  <circle cx={x} cy={y} r="4" fill={STROKE_COLOR} />
);

/**
 * Wire connection between two points
 */
export const WireConnection: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  curved?: boolean;
}> = ({ x1, y1, x2, y2, curved = false }) => {
  if (curved) {
    // Create an L-shaped or curved wire
    const midX = x1;
    const midY = y2;
    return (
      <polyline
        points={`${x1},${y1} ${midX},${midY} ${x2},${y2}`}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
    );
  }
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
    />
  );
};

// Export all symbols as a map for easy access
export const CircuitSymbolMap: Record<string, React.FC<SymbolProps>> = {
  battery: BatterySymbol,
  cell: CellSymbol,
  bulb: BulbSymbol,
  resistor: ResistorSymbol,
  switch: SwitchSymbol,
  ammeter: AmmeterSymbol,
  voltmeter: VoltmeterSymbol,
  capacitor: CapacitorSymbol,
  diode: DiodeSymbol,
  led: LEDSymbol,
  motor: MotorSymbol,
  bell: BellSymbol,
  fuse: FuseSymbol,
  junction: JunctionSymbol,
};
