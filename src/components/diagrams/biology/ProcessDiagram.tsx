import React from 'react';
import { DiagramSpec, BiologyElement } from '../../../types/diagram';
import {
  CellMembrane,
  NucleusSymbol,
  MitochondriaSymbol,
  ChloroplastSymbol,
  VacuoleSymbol,
  RibosomeSymbol,
  OrganismBox,
  ProcessArrow,
  LabelBox,
} from './symbols/BiologySymbols';

interface ProcessDiagramProps {
  spec: DiagramSpec;
  className?: string;
}

const STROKE_COLOR = '#000000';

/**
 * Renders exam-paper style biology diagrams
 * (cell structures, food chains, body systems, etc.)
 */
const ProcessDiagram: React.FC<ProcessDiagramProps> = ({ spec, className = '' }) => {
  const width = spec.width || 350;
  const height = spec.height || 250;
  const elements = spec.elements as BiologyElement[];
  const connections = spec.connections || [];

  // Create position map for connections
  const elementPositions = new Map<string, { x: number; y: number }>();
  elements.forEach(el => {
    if (el.position && el.id) {
      elementPositions.set(el.id, el.position);
    }
  });

  // Render element based on type
  const renderElement = (element: BiologyElement, index: number) => {
    const { id, type, position, label } = element;

    switch (type) {
      case 'cell':
      case 'cell_membrane':
        return (
          <CellMembrane
            key={id || index}
            x={position.x - (element.width || 120) / 2}
            y={position.y - (element.height || 80) / 2}
            width={element.width || 120}
            height={element.height || 80}
            shape={element.shape}
          />
        );

      case 'nucleus':
        return (
          <NucleusSymbol
            key={id || index}
            x={position.x}
            y={position.y}
          />
        );

      case 'mitochondria':
        return (
          <MitochondriaSymbol
            key={id || index}
            x={position.x}
            y={position.y}
            width={element.width}
            height={element.height}
          />
        );

      case 'chloroplast':
        return (
          <ChloroplastSymbol
            key={id || index}
            x={position.x}
            y={position.y}
            width={element.width}
            height={element.height}
          />
        );

      case 'vacuole':
        return (
          <VacuoleSymbol
            key={id || index}
            x={position.x}
            y={position.y}
            width={element.width}
            height={element.height}
          />
        );

      case 'ribosome':
        return (
          <RibosomeSymbol
            key={id || index}
            x={position.x}
            y={position.y}
          />
        );

      case 'organism':
        return (
          <OrganismBox
            key={id || index}
            x={position.x}
            y={position.y}
            width={element.width}
            height={element.height}
            label={label || ''}
          />
        );

      case 'label_box':
        return (
          <LabelBox
            key={id || index}
            x={position.x}
            y={position.y}
            text={label || ''}
            width={element.width}
            height={element.height}
          />
        );

      case 'arrow':
        // For standalone arrows defined as elements
        const dir = element.direction || 0;
        const mag = element.magnitude || 50;
        const radians = (dir * Math.PI) / 180;
        return (
          <ProcessArrow
            key={id || index}
            x1={position.x}
            y1={position.y}
            x2={position.x + mag * Math.cos(radians)}
            y2={position.y - mag * Math.sin(radians)}
            label={label}
          />
        );

      default:
        // Default to a label box for unknown types
        if (label) {
          return (
            <LabelBox
              key={id || index}
              x={position.x}
              y={position.y}
              text={label}
            />
          );
        }
        return null;
    }
  };

  // Render connections between elements
  const renderConnection = (conn: typeof connections[0], index: number) => {
    const fromPos = elementPositions.get(conn.from);
    const toPos = elementPositions.get(conn.to);

    if (!fromPos || !toPos) return null;

    // Get element dimensions to calculate edge positions
    const fromElement = elements.find(e => e.id === conn.from);
    const toElement = elements.find(e => e.id === conn.to);

    const fromWidth = fromElement?.width || 80;
    const toWidth = toElement?.width || 80;

    // Calculate connection points (from right edge of source to left edge of target)
    let x1 = fromPos.x + fromWidth / 2;
    let y1 = fromPos.y;
    let x2 = toPos.x - toWidth / 2;
    let y2 = toPos.y;

    // Adjust based on port specification
    if (conn.fromPort === 'bottom') { x1 = fromPos.x; y1 = fromPos.y + (fromElement?.height || 40) / 2; }
    if (conn.fromPort === 'top') { x1 = fromPos.x; y1 = fromPos.y - (fromElement?.height || 40) / 2; }
    if (conn.toPort === 'top') { x2 = toPos.x; y2 = toPos.y - (toElement?.height || 40) / 2; }
    if (conn.toPort === 'bottom') { x2 = toPos.x; y2 = toPos.y + (toElement?.height || 40) / 2; }

    return (
      <ProcessArrow
        key={`conn-${index}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        label={conn.label}
        curved={conn.curved}
      />
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

          {/* Render connections first (behind elements) */}
          {connections.map((conn, index) => renderConnection(conn, index))}

          {/* Render all elements */}
          {elements.map((element, index) => renderElement(element, index))}

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

export default ProcessDiagram;
