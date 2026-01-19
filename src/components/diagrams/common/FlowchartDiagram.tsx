import React from 'react';
import { DiagramSpec } from '../../../types/diagram';

interface FlowchartDiagramProps {
  spec: DiagramSpec;
  className?: string;
}

interface FlowchartElement {
  id: string;
  type: 'box' | 'diamond' | 'oval' | 'parallelogram';
  position: { x: number; y: number };
  label?: string;
  width?: number;
  height?: number;
}

const STROKE_COLOR = '#000000';
const STROKE_WIDTH = 2;

/**
 * Renders exam-paper style flowchart diagrams
 * (generic boxes, decision diamonds, process ovals)
 */
const FlowchartDiagram: React.FC<FlowchartDiagramProps> = ({ spec, className = '' }) => {
  const width = spec.width || 350;
  const height = spec.height || 300;
  const elements = (spec.elements || []) as FlowchartElement[];
  const connections = spec.connections || [];

  // Create position map for connections
  const elementPositions = new Map<string, { x: number; y: number; width: number; height: number }>();
  elements.forEach(el => {
    if (el.position && el.id) {
      elementPositions.set(el.id, {
        x: el.position.x,
        y: el.position.y,
        width: el.width || 100,
        height: el.height || 50,
      });
    }
  });

  // Render element based on type
  const renderElement = (element: FlowchartElement, index: number) => {
    const { id, type, position, label, width: elWidth, height: elHeight } = element;
    const w = elWidth || 100;
    const h = elHeight || 50;

    switch (type) {
      case 'box':
        return (
          <g key={id || index}>
            <rect
              x={position.x - w / 2}
              y={position.y - h / 2}
              width={w}
              height={h}
              fill="white"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
              rx="4"
              ry="4"
            />
            {label && (
              <text
                x={position.x}
                y={position.y + 5}
                fontSize="12"
                textAnchor="middle"
                fill={STROKE_COLOR}
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'diamond':
        const dw = w / 2;
        const dh = h / 2;
        return (
          <g key={id || index}>
            <polygon
              points={`${position.x},${position.y - dh} ${position.x + dw},${position.y} ${position.x},${position.y + dh} ${position.x - dw},${position.y}`}
              fill="white"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
            />
            {label && (
              <text
                x={position.x}
                y={position.y + 4}
                fontSize="11"
                textAnchor="middle"
                fill={STROKE_COLOR}
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'oval':
        return (
          <g key={id || index}>
            <ellipse
              cx={position.x}
              cy={position.y}
              rx={w / 2}
              ry={h / 2}
              fill="white"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
            />
            {label && (
              <text
                x={position.x}
                y={position.y + 5}
                fontSize="12"
                textAnchor="middle"
                fill={STROKE_COLOR}
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'parallelogram':
        const skew = 15;
        return (
          <g key={id || index}>
            <polygon
              points={`
                ${position.x - w / 2 + skew},${position.y - h / 2}
                ${position.x + w / 2 + skew},${position.y - h / 2}
                ${position.x + w / 2 - skew},${position.y + h / 2}
                ${position.x - w / 2 - skew},${position.y + h / 2}
              `}
              fill="white"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
            />
            {label && (
              <text
                x={position.x}
                y={position.y + 5}
                fontSize="12"
                textAnchor="middle"
                fill={STROKE_COLOR}
              >
                {label}
              </text>
            )}
          </g>
        );

      default:
        // Default to box
        return (
          <g key={id || index}>
            <rect
              x={position.x - w / 2}
              y={position.y - h / 2}
              width={w}
              height={h}
              fill="white"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
            />
            {label && (
              <text
                x={position.x}
                y={position.y + 5}
                fontSize="12"
                textAnchor="middle"
                fill={STROKE_COLOR}
              >
                {label}
              </text>
            )}
          </g>
        );
    }
  };

  // Render connections with arrows
  const renderConnection = (conn: typeof connections[0], index: number) => {
    const from = elementPositions.get(conn.from);
    const to = elementPositions.get(conn.to);

    if (!from || !to) return null;

    // Calculate connection points
    let x1 = from.x;
    let y1 = from.y + from.height / 2; // Default: from bottom
    let x2 = to.x;
    let y2 = to.y - to.height / 2; // Default: to top

    // Adjust based on port specification
    if (conn.fromPort === 'right') { x1 = from.x + from.width / 2; y1 = from.y; }
    if (conn.fromPort === 'left') { x1 = from.x - from.width / 2; y1 = from.y; }
    if (conn.fromPort === 'top') { x1 = from.x; y1 = from.y - from.height / 2; }
    if (conn.toPort === 'right') { x2 = to.x + to.width / 2; y2 = to.y; }
    if (conn.toPort === 'left') { x2 = to.x - to.width / 2; y2 = to.y; }
    if (conn.toPort === 'bottom') { x2 = to.x; y2 = to.y + to.height / 2; }

    // Arrow head
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const arrowSize = 8;

    // Draw curved or straight line
    let path: string;
    let labelX: number;
    let labelY: number;

    if (conn.curved) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const controlX = midX + (Math.abs(dy) > Math.abs(dx) ? 30 : 0);
      const controlY = midY - (Math.abs(dx) > Math.abs(dy) ? 30 : 0);
      path = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
      labelX = controlX;
      labelY = controlY - 10;
    } else {
      path = `M ${x1} ${y1} L ${x2} ${y2}`;
      labelX = (x1 + x2) / 2;
      labelY = (y1 + y2) / 2 - 10;
    }

    return (
      <g key={`conn-${index}`}>
        <path
          d={path}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={1.5}
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
        {conn.label && (
          <text
            x={labelX}
            y={labelY}
            fontSize="10"
            textAnchor="middle"
            fill={STROKE_COLOR}
          >
            {conn.label}
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

export default FlowchartDiagram;
