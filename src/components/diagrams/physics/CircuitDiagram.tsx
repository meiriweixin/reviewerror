import React from 'react';
import { DiagramSpec, CircuitElement, Connection } from '../../../types/diagram';
import {
  BatterySymbol,
  CellSymbol,
  BulbSymbol,
  ResistorSymbol,
  SwitchSymbol,
  AmmeterSymbol,
  VoltmeterSymbol,
  CapacitorSymbol,
  DiodeSymbol,
  LEDSymbol,
  MotorSymbol,
  BellSymbol,
  FuseSymbol,
  JunctionSymbol,
  WireConnection,
} from './symbols/CircuitSymbols';

interface CircuitDiagramProps {
  spec: DiagramSpec;
  className?: string;
}

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 2;

/**
 * Renders exam-paper style circuit diagrams
 * Uses proper electrical symbols (battery, bulb, resistor, etc.)
 */
const CircuitDiagram: React.FC<CircuitDiagramProps> = ({ spec, className = '' }) => {
  const width = spec.width || 400;
  const height = spec.height || 200;
  const elements = spec.elements as CircuitElement[];
  const connections = spec.connections || [];

  // Get element position by ID
  const getElementPosition = (elementId: string): { x: number; y: number } | null => {
    const element = elements.find(e => e.id === elementId);
    if (element) {
      return element.position;
    }
    return null;
  };

  // Render a circuit component based on type
  const renderComponent = (element: CircuitElement) => {
    const { id, type, position, rotation = 0, value, label, state } = element;

    const commonProps = {
      x: position.x,
      y: position.y,
      rotation,
      value,
      label,
    };

    switch (type) {
      case 'battery':
        return <BatterySymbol key={id} {...commonProps} />;
      case 'cell':
        return <CellSymbol key={id} {...commonProps} />;
      case 'bulb':
        return <BulbSymbol key={id} {...commonProps} />;
      case 'resistor':
        return <ResistorSymbol key={id} {...commonProps} />;
      case 'switch':
        return <SwitchSymbol key={id} {...commonProps} state={state} />;
      case 'ammeter':
        return <AmmeterSymbol key={id} {...commonProps} />;
      case 'voltmeter':
        return <VoltmeterSymbol key={id} {...commonProps} />;
      case 'capacitor':
        return <CapacitorSymbol key={id} {...commonProps} />;
      case 'diode':
        return <DiodeSymbol key={id} {...commonProps} />;
      case 'led':
        return <LEDSymbol key={id} {...commonProps} />;
      case 'motor':
        return <MotorSymbol key={id} {...commonProps} />;
      case 'bell':
        return <BellSymbol key={id} {...commonProps} />;
      case 'fuse':
        return <FuseSymbol key={id} {...commonProps} />;
      case 'junction':
        return <JunctionSymbol key={id} x={position.x} y={position.y} />;
      default:
        return null;
    }
  };

  // Render wire connections between components
  const renderConnection = (connection: Connection, index: number) => {
    const fromPos = getElementPosition(connection.from);
    const toPos = getElementPosition(connection.to);

    if (!fromPos || !toPos) return null;

    // Calculate connection points based on port positions
    // Each component has connection points at +/- 25-35 pixels from center
    const getPortOffset = (port: string | undefined, isFrom: boolean) => {
      const defaultOffset = isFrom ? { x: 30, y: 0 } : { x: -30, y: 0 };
      switch (port) {
        case 'top': return { x: 0, y: -30 };
        case 'bottom': return { x: 0, y: 30 };
        case 'left': return { x: -30, y: 0 };
        case 'right': return { x: 30, y: 0 };
        default: return defaultOffset;
      }
    };

    const fromOffset = getPortOffset(connection.fromPort, true);
    const toOffset = getPortOffset(connection.toPort, false);

    const x1 = fromPos.x + fromOffset.x;
    const y1 = fromPos.y + fromOffset.y;
    const x2 = toPos.x + toOffset.x;
    const y2 = toPos.y + toOffset.y;

    // Determine if we need a curved (L-shaped) wire
    const needsCurve = Math.abs(y1 - y2) > 10 && Math.abs(x1 - x2) > 10;

    if (needsCurve || connection.curved) {
      // Create L-shaped wire path
      // Decide whether to go horizontal-first or vertical-first
      const goHorizontalFirst = Math.abs(x1 - x2) > Math.abs(y1 - y2);

      let pathD: string;
      if (goHorizontalFirst) {
        const midX = (x1 + x2) / 2;
        pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
      } else {
        const midY = (y1 + y2) / 2;
        pathD = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      }

      return (
        <g key={`connection-${index}`}>
          <path
            d={pathD}
            fill="none"
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
          {/* Label if present */}
          {connection.label && (
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 - 8}
              fontSize="10"
              textAnchor="middle"
              fill={STROKE_COLOR}
            >
              {connection.label}
            </text>
          )}
        </g>
      );
    }

    return (
      <g key={`connection-${index}`}>
        <WireConnection x1={x1} y1={y1} x2={x2} y2={y2} />
        {/* Label if present */}
        {connection.label && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 8}
            fontSize="10"
            textAnchor="middle"
            fill={STROKE_COLOR}
          >
            {connection.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-50 rounded-xl border border-gray-200 dark:border-gray-300 overflow-hidden ${className}`}>
      {/* Title if present */}
      {spec.title && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-300">
          <h4 className="text-sm font-medium text-gray-700">{spec.title}</h4>
        </div>
      )}

      <div className="p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="auto"
          style={{ maxHeight: height }}
          className="block"
        >
          {/* Background */}
          <rect x="0" y="0" width={width} height={height} fill="white" />

          {/* Render connections first (behind components) */}
          {connections.map((conn, index) => renderConnection(conn, index))}

          {/* Render components */}
          {elements.map(element => renderComponent(element))}

          {/* Render annotations */}
          {spec.annotations?.map((annotation, index) => (
            <text
              key={`annotation-${index}`}
              x={annotation.position.x}
              y={annotation.position.y}
              fontSize={annotation.fontSize || 12}
              fontWeight={annotation.fontWeight || 'normal'}
              textAnchor={annotation.textAnchor || 'start'}
              fill={STROKE_COLOR}
              transform={annotation.rotation ? `rotate(${annotation.rotation}, ${annotation.position.x}, ${annotation.position.y})` : undefined}
            >
              {annotation.text}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default CircuitDiagram;
