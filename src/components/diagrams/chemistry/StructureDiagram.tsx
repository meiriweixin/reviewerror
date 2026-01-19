import React from 'react';
import { DiagramSpec, MoleculeElement } from '../../../types/diagram';
import {
  AtomSymbol,
  SingleBond,
  DoubleBond,
  TripleBond,
  DashedBond,
  WedgeBond,
  LonePair,
  ReactionArrow,
} from './symbols/MoleculeSymbols';

interface StructureDiagramProps {
  spec: DiagramSpec;
  className?: string;
}

const STROKE_COLOR = '#000000';

/**
 * Renders exam-paper style molecular structure diagrams
 */
const StructureDiagram: React.FC<StructureDiagramProps> = ({ spec, className = '' }) => {
  const width = spec.width || 300;
  const height = spec.height || 200;
  const elements = spec.elements as MoleculeElement[];

  // Create a map of element positions by ID for bond rendering
  const elementPositions = new Map<string, { x: number; y: number }>();
  elements.forEach(el => {
    if (el.position && el.id) {
      elementPositions.set(el.id, el.position);
    }
  });

  // Render element based on type
  const renderElement = (element: MoleculeElement, index: number) => {
    const { id, type, position } = element;

    switch (type) {
      case 'atom':
        if (!position) return null;
        return (
          <AtomSymbol
            key={id || index}
            x={position.x}
            y={position.y}
            symbol={element.symbol || '?'}
            charge={element.charge}
          />
        );

      case 'bond':
        const fromPos = element.from ? elementPositions.get(element.from) : null;
        const toPos = element.to ? elementPositions.get(element.to) : null;
        if (!fromPos || !toPos) return null;

        // Shorten bonds to not overlap with atom symbols
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const shortenBy = 14; // Account for atom symbol size
        const x1 = fromPos.x + (dx / length) * shortenBy;
        const y1 = fromPos.y + (dy / length) * shortenBy;
        const x2 = toPos.x - (dx / length) * shortenBy;
        const y2 = toPos.y - (dy / length) * shortenBy;

        switch (element.bondType) {
          case 'double':
            return <DoubleBond key={id || index} x1={x1} y1={y1} x2={x2} y2={y2} />;
          case 'triple':
            return <TripleBond key={id || index} x1={x1} y1={y1} x2={x2} y2={y2} />;
          case 'dashed':
            return <DashedBond key={id || index} x1={x1} y1={y1} x2={x2} y2={y2} />;
          case 'wedge':
            return <WedgeBond key={id || index} x1={x1} y1={y1} x2={x2} y2={y2} />;
          case 'single':
          default:
            return <SingleBond key={id || index} x1={x1} y1={y1} x2={x2} y2={y2} />;
        }

      case 'lone_pair':
        if (!position) return null;
        return (
          <LonePair
            key={id || index}
            x={position.x}
            y={position.y}
            direction={element.direction || 90}
          />
        );

      default:
        return null;
    }
  };

  // Render connections (for reaction arrows, etc.)
  const renderConnections = () => {
    if (!spec.connections) return null;

    return spec.connections.map((conn, index) => {
      const fromPos = elementPositions.get(conn.from);
      const toPos = elementPositions.get(conn.to);

      if (!fromPos || !toPos) return null;

      if (conn.type === 'arrow' || conn.type === 'double_arrow') {
        return (
          <ReactionArrow
            key={`conn-${index}`}
            x1={fromPos.x + 30}
            y1={fromPos.y}
            x2={toPos.x - 30}
            y2={toPos.y}
            reversible={conn.type === 'double_arrow'}
            label={conn.label}
          />
        );
      }

      return null;
    });
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

          {/* Render bonds first (behind atoms) */}
          {elements
            .filter(el => el.type === 'bond')
            .map((element, index) => renderElement(element, index))}

          {/* Render connections */}
          {renderConnections()}

          {/* Render atoms on top */}
          {elements
            .filter(el => el.type !== 'bond')
            .map((element, index) => renderElement(element, index))}

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
            >
              {annotation.text}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default StructureDiagram;
