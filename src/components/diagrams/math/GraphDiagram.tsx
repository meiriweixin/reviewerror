import React from 'react';
import { DiagramSpec, GraphElement } from '../../../types/diagram';
import {
  CoordinateAxes,
  GridLines,
  TickMarks,
  PlotPoint,
  GraphLine,
  GraphCurve,
  Parabola,
  LinearFunction,
  Asymptote,
  ShadedRegion,
  GraphArrow,
  GraphCircle,
  EquationLabel,
} from './symbols/GraphSymbols';

interface GraphDiagramProps {
  spec: DiagramSpec;
  className?: string;
}

const STROKE_COLOR = '#000000';

/**
 * Renders exam-paper style coordinate graphs
 * Supports: axes, grid, points, lines, curves, parabolas, circles, shaded regions
 */
const GraphDiagram: React.FC<GraphDiagramProps> = ({ spec, className = '' }) => {
  const width = spec.width || 300;
  const height = spec.height || 300;
  const elements = (spec.elements || []) as GraphElement[];

  // Default graph settings - can be overridden by elements
  const defaultScale = 30; // pixels per unit
  const defaultOriginX = width / 2;
  const defaultOriginY = height / 2;

  // Find grid/axis elements to determine scale and origin
  const gridElement = elements.find(e => e.type === 'grid');
  const xAxisElement = elements.find(e => e.type === 'x_axis');
  const yAxisElement = elements.find(e => e.type === 'y_axis');

  const scale = gridElement?.spacing || defaultScale;

  // Calculate origin from axis elements or use defaults
  let originX = defaultOriginX;
  let originY = defaultOriginY;

  if (xAxisElement?.start && xAxisElement?.end) {
    originY = xAxisElement.start.y;
  }
  if (yAxisElement?.start && yAxisElement?.end) {
    originX = yAxisElement.start.x;
  }

  // Helper: convert graph coordinates to SVG coordinates
  const toSvgX = (graphX: number) => originX + graphX * scale;
  const toSvgY = (graphY: number) => originY - graphY * scale; // Y is inverted

  // Helper: parse equation string to extract coefficients
  const parseLinearEquation = (eq: string): { m: number; c: number } | null => {
    // Try to parse "y = mx + c" or "y = mx - c" format
    const match = eq.match(/y\s*=\s*([-\d.]*)\s*x\s*([+-]\s*[\d.]+)?/i);
    if (match) {
      const m = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : parseFloat(match[1]);
      const c = match[2] ? parseFloat(match[2].replace(/\s/g, '')) : 0;
      return { m, c };
    }
    return null;
  };

  const parseQuadraticEquation = (eq: string): { a: number; b: number; c: number } | null => {
    // Try to parse "y = ax² + bx + c" format
    const match = eq.match(/y\s*=\s*([-\d.]*)\s*x[²2]\s*([+-]\s*[\d.]*x)?\s*([+-]\s*[\d.]+)?/i);
    if (match) {
      const a = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : parseFloat(match[1]);
      let b = 0;
      if (match[2]) {
        const bStr = match[2].replace(/\s/g, '').replace('x', '');
        b = bStr === '+' || bStr === '' ? 1 : bStr === '-' ? -1 : parseFloat(bStr);
      }
      const c = match[3] ? parseFloat(match[3].replace(/\s/g, '')) : 0;
      return { a, b, c };
    }
    return null;
  };

  // Render element based on type
  const renderElement = (element: GraphElement, index: number) => {
    const { id, type } = element;

    switch (type) {
      case 'x_axis':
      case 'y_axis':
        // Axes are rendered separately below
        return null;

      case 'grid':
        // Grid is rendered separately below
        return null;

      case 'point':
        if (!element.position) return null;
        return (
          <PlotPoint
            key={id || `point-${index}`}
            x={toSvgX(element.position.x)}
            y={toSvgY(element.position.y)}
            label={element.label}
            filled={true}
          />
        );

      case 'line':
        if (element.equation) {
          // Parse equation and draw line
          const coeffs = parseLinearEquation(element.equation);
          if (coeffs) {
            return (
              <g key={id || `line-${index}`}>
                <LinearFunction
                  m={coeffs.m}
                  c={coeffs.c}
                  originX={originX}
                  originY={originY}
                  scale={scale}
                  xMin={-Math.floor(originX / scale)}
                  xMax={Math.floor((width - originX) / scale)}
                />
                {element.label && (
                  <EquationLabel
                    x={width - 80}
                    y={30 + index * 15}
                    equation={element.label}
                  />
                )}
              </g>
            );
          }
        }
        // Draw line from points
        if (element.points && element.points.length >= 2) {
          const p1 = element.points[0];
          const p2 = element.points[1];
          return (
            <GraphLine
              key={id || `line-${index}`}
              x1={toSvgX(p1.x)}
              y1={toSvgY(p1.y)}
              x2={toSvgX(p2.x)}
              y2={toSvgY(p2.y)}
              extendToEdge={true}
              width={width}
              height={height}
            />
          );
        }
        return null;

      case 'curve':
        if (!element.points || element.points.length < 2) return null;
        const curvePoints = element.points.map(p => ({
          x: toSvgX(p.x),
          y: toSvgY(p.y),
        }));
        return (
          <g key={id || `curve-${index}`}>
            <GraphCurve points={curvePoints} smooth={true} />
            {element.label && (
              <EquationLabel
                x={curvePoints[0].x + 10}
                y={curvePoints[0].y - 10}
                equation={element.label}
              />
            )}
          </g>
        );

      case 'parabola':
        if (element.equation) {
          const coeffs = parseQuadraticEquation(element.equation);
          if (coeffs) {
            return (
              <g key={id || `parabola-${index}`}>
                <Parabola
                  a={coeffs.a}
                  b={coeffs.b}
                  c={coeffs.c}
                  originX={originX}
                  originY={originY}
                  scale={scale}
                  xMin={-Math.floor(originX / scale)}
                  xMax={Math.floor((width - originX) / scale)}
                />
                {element.label && (
                  <EquationLabel
                    x={width - 100}
                    y={30 + index * 15}
                    equation={element.label}
                  />
                )}
              </g>
            );
          }
        }
        // Fallback: draw from points
        if (element.points && element.points.length >= 3) {
          const parabolaPoints = element.points.map(p => ({
            x: toSvgX(p.x),
            y: toSvgY(p.y),
          }));
          return <GraphCurve key={id || `parabola-${index}`} points={parabolaPoints} smooth={true} />;
        }
        return null;

      case 'circle':
        if (!element.position) return null;
        const circleRadius = element.radius || 1;
        return (
          <GraphCircle
            key={id || `circle-${index}`}
            cx={toSvgX(element.position.x)}
            cy={toSvgY(element.position.y)}
            radius={circleRadius * scale}
          />
        );

      case 'asymptote':
        if (!element.start || !element.end) return null;
        return (
          <Asymptote
            key={id || `asymptote-${index}`}
            x1={toSvgX(element.start.x)}
            y1={toSvgY(element.start.y)}
            x2={toSvgX(element.end.x)}
            y2={toSvgY(element.end.y)}
            label={element.label}
          />
        );

      case 'shaded_region':
        if (!element.points || element.points.length < 3) return null;
        const regionPoints = element.points.map(p => ({
          x: toSvgX(p.x),
          y: toSvgY(p.y),
        }));
        return (
          <ShadedRegion
            key={id || `region-${index}`}
            points={regionPoints}
            pattern="lines"
          />
        );

      case 'arrow':
        if (!element.start || !element.end) return null;
        return (
          <GraphArrow
            key={id || `arrow-${index}`}
            x1={toSvgX(element.start.x)}
            y1={toSvgY(element.start.y)}
            x2={toSvgX(element.end.x)}
            y2={toSvgY(element.end.y)}
            label={element.label}
          />
        );

      default:
        return null;
    }
  };

  // Check what elements to render
  const showGrid = elements.some(e => e.type === 'grid');
  const showAxes = elements.some(e => e.type === 'x_axis' || e.type === 'y_axis');
  const showTicks = !showGrid && showAxes; // Show ticks if no grid but axes present

  // Get axis labels
  const xLabel = xAxisElement?.label || 'x';
  const yLabel = yAxisElement?.label || 'y';

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

          {/* Grid (rendered first, behind everything) */}
          {showGrid && (
            <GridLines
              originX={originX}
              originY={originY}
              width={width}
              height={height}
              spacing={scale}
              showNumbers={true}
            />
          )}

          {/* Tick marks (if no grid) */}
          {showTicks && (
            <TickMarks
              originX={originX}
              originY={originY}
              width={width}
              height={height}
              spacing={scale}
              showNumbers={true}
            />
          )}

          {/* Coordinate axes */}
          {showAxes && (
            <CoordinateAxes
              originX={originX}
              originY={originY}
              width={width}
              height={height}
              xLabel={xLabel}
              yLabel={yLabel}
              showArrows={true}
            />
          )}

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

export default GraphDiagram;
