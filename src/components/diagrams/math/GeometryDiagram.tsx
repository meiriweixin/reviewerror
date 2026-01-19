import React from 'react';
import { DiagramSpec, GeometryElement } from '../../../types/diagram';
import {
  PointSymbol,
  SegmentLine,
  RayLine,
  InfiniteLine,
  AngleSymbol,
  CircleShape,
  ArcShape,
  TriangleShape,
  RectangleShape,
  ParallelMark,
  EqualMark,
  PerpendicularMark,
} from './symbols/GeometrySymbols';

interface GeometryDiagramProps {
  spec: DiagramSpec;
  className?: string;
}

const STROKE_COLOR = '#000000';

/**
 * Renders exam-paper style geometry diagrams
 */
const GeometryDiagram: React.FC<GeometryDiagramProps> = ({ spec, className = '' }) => {
  const width = spec.width || 300;
  const height = spec.height || 250;
  const elements = spec.elements as GeometryElement[];

  // Render element based on type
  const renderElement = (element: GeometryElement, index: number) => {
    const { id, type } = element;

    switch (type) {
      case 'point':
        if (!element.position) return null;
        return (
          <PointSymbol
            key={id || index}
            x={element.position.x}
            y={element.position.y}
            label={element.label}
          />
        );

      case 'segment':
        if (!element.start || !element.end) return null;
        return (
          <SegmentLine
            key={id || index}
            x1={element.start.x}
            y1={element.start.y}
            x2={element.end.x}
            y2={element.end.y}
            dashed={element.dashed}
            showMeasurement={element.showMeasurement ? element.label : undefined}
          />
        );

      case 'ray':
        if (!element.start || !element.end) return null;
        return (
          <RayLine
            key={id || index}
            x1={element.start.x}
            y1={element.start.y}
            x2={element.end.x}
            y2={element.end.y}
          />
        );

      case 'line':
        if (!element.start || !element.end) return null;
        return (
          <InfiniteLine
            key={id || index}
            x1={element.start.x}
            y1={element.start.y}
            x2={element.end.x}
            y2={element.end.y}
          />
        );

      case 'angle':
        if (!element.vertex || !element.ray1End || !element.ray2End) return null;
        return (
          <AngleSymbol
            key={id || index}
            vertex={element.vertex}
            ray1End={element.ray1End}
            ray2End={element.ray2End}
            angleDegrees={element.angleDegrees}
            showRightAngle={element.angleDegrees === 90}
          />
        );

      case 'circle':
        if (!element.center || !element.radius) return null;
        return (
          <CircleShape
            key={id || index}
            cx={element.center.x}
            cy={element.center.y}
            radius={element.radius}
            dashed={element.dashed}
            showCenter={true}
            label={element.label}
          />
        );

      case 'arc':
        if (!element.center || !element.radius) return null;
        return (
          <ArcShape
            key={id || index}
            cx={element.center.x}
            cy={element.center.y}
            radius={element.radius}
            startAngle={element.startAngle || 0}
            endAngle={element.endAngle || 90}
          />
        );

      case 'triangle':
        if (!element.vertices || element.vertices.length !== 3) return null;
        return (
          <TriangleShape
            key={id || index}
            vertices={element.vertices}
            labels={element.label ? element.label.split(',') : undefined}
          />
        );

      case 'rectangle':
      case 'square':
        if (!element.position) return null;
        const rectWidth = (element as any).width || 80;
        const rectHeight = (element as any).height || (type === 'square' ? rectWidth : 60);
        return (
          <RectangleShape
            key={id || index}
            x={element.position.x}
            y={element.position.y}
            width={rectWidth}
            height={rectHeight}
          />
        );

      case 'polygon':
        if (!element.vertices) return null;
        const points = element.vertices.map(v => `${v.x},${v.y}`).join(' ');
        return (
          <polygon
            key={id || index}
            points={points}
            fill="none"
            stroke={STROKE_COLOR}
            strokeWidth={2}
          />
        );

      case 'parallel_mark':
        if (!element.position) return null;
        return (
          <ParallelMark
            key={id || index}
            x={element.position.x}
            y={element.position.y}
            angle={(element as any).angle || 0}
            count={(element as any).count || 1}
          />
        );

      case 'equal_mark':
        if (!element.position) return null;
        return (
          <EqualMark
            key={id || index}
            x={element.position.x}
            y={element.position.y}
            angle={(element as any).angle || 0}
            count={(element as any).count || 1}
          />
        );

      case 'perpendicular_mark':
        if (!element.position) return null;
        return (
          <PerpendicularMark
            key={id || index}
            x={element.position.x}
            y={element.position.y}
            angle={(element as any).angle || 0}
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

export default GeometryDiagram;
