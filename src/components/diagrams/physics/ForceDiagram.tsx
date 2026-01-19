import React from 'react';
import { DiagramSpec, ForceElement } from '../../../types/diagram';
import {
  ForceVector,
  AngleArc,
  ObjectShape,
  SurfaceLine,
  PivotPoint,
  SpringSymbol,
  PulleySymbol,
  RopeLine,
} from './symbols/ForceSymbols';

interface ForceDiagramProps {
  spec: DiagramSpec;
  className?: string;
}

const STROKE_COLOR = '#000000';

/**
 * Renders exam-paper style force diagrams (free-body diagrams)
 * Uses proper force vectors with arrowheads
 */
const ForceDiagram: React.FC<ForceDiagramProps> = ({ spec, className = '' }) => {
  const width = spec.width || 300;
  const height = spec.height || 250;
  const elements = spec.elements as ForceElement[];

  // Render a force element based on type
  const renderElement = (element: ForceElement, index: number) => {
    const { id, type, position } = element;

    switch (type) {
      case 'object':
        return (
          <ObjectShape
            key={id || index}
            x={position.x}
            y={position.y}
            shape={element.shape || 'rectangle'}
            width={element.width}
            height={element.height}
            label={element.label}
          />
        );

      case 'force_vector':
        return (
          <ForceVector
            key={id || index}
            x={position.x}
            y={position.y}
            direction={element.direction || 0}
            magnitude={element.magnitude || 50}
            label={element.label}
            color={element.color || STROKE_COLOR}
          />
        );

      case 'surface':
        return (
          <SurfaceLine
            key={id || index}
            x={position.x}
            y={position.y}
            length={element.length || 200}
            angle={element.angle || 0}
          />
        );

      case 'pivot':
        return (
          <PivotPoint
            key={id || index}
            x={position.x}
            y={position.y}
          />
        );

      case 'angle_arc':
        return (
          <AngleArc
            key={id || index}
            cx={element.vertex?.x || position.x}
            cy={element.vertex?.y || position.y}
            startAngle={0}
            endAngle={element.angleDegrees || 45}
          />
        );

      case 'spring':
        return (
          <SpringSymbol
            key={id || index}
            x1={position.x}
            y1={position.y}
            x2={(element as any).endX || position.x + 80}
            y2={(element as any).endY || position.y}
          />
        );

      case 'pulley':
        return (
          <PulleySymbol
            key={id || index}
            x={position.x}
            y={position.y}
          />
        );

      case 'rope':
        return (
          <RopeLine
            key={id || index}
            x1={position.x}
            y1={position.y}
            x2={(element as any).endX || position.x}
            y2={(element as any).endY || position.y + 50}
          />
        );

      default:
        return null;
    }
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
              fontStyle={annotation.fontStyle || 'normal'}
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

export default ForceDiagram;
