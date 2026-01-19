import React from 'react';
import { DiagramSpec } from '../../types/diagram';
import CircuitDiagram from './physics/CircuitDiagram';
import ForceDiagram from './physics/ForceDiagram';
import StructureDiagram from './chemistry/StructureDiagram';
import GeometryDiagram from './math/GeometryDiagram';
import GraphDiagram from './math/GraphDiagram';
import ProcessDiagram from './biology/ProcessDiagram';
import FlowchartDiagram from './common/FlowchartDiagram';

interface DiagramRendererProps {
  spec: DiagramSpec | string;
  subject?: string;
  className?: string;
}

/**
 * Main diagram router component
 * Routes to subject-specific renderers based on diagram type
 */
const DiagramRenderer: React.FC<DiagramRendererProps> = ({ spec, subject, className = '' }) => {
  // Try to parse string as JSON
  let parsedSpec: DiagramSpec | null = null;

  if (typeof spec === 'string') {
    try {
      parsedSpec = JSON.parse(spec) as DiagramSpec;
    } catch {
      // If parsing fails, show as fallback flowchart
      return (
        <div className={`bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 ${className}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Unable to parse diagram data
          </p>
        </div>
      );
    }
  } else {
    parsedSpec = spec;
  }

  if (!parsedSpec || !parsedSpec.type) {
    return (
      <div className={`bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No diagram data available
        </p>
      </div>
    );
  }

  // Route to appropriate renderer based on diagram type
  switch (parsedSpec.type) {
    case 'physics_circuit':
      return <CircuitDiagram spec={parsedSpec} className={className} />;

    case 'physics_force':
      return <ForceDiagram spec={parsedSpec} className={className} />;

    case 'physics_optics':
      // TODO: Implement OpticsDiagram
      return <ForceDiagram spec={parsedSpec} className={className} />;

    case 'chemistry_structure':
    case 'chemistry_reaction':
      return <StructureDiagram spec={parsedSpec} className={className} />;

    case 'math_geometry':
      return <GeometryDiagram spec={parsedSpec} className={className} />;

    case 'math_graph':
      return <GraphDiagram spec={parsedSpec} className={className} />;

    case 'math_tree':
      // TODO: Implement TreeDiagram
      return <FlowchartDiagram spec={parsedSpec} className={className} />;

    case 'biology_process':
    case 'biology_cell':
      return <ProcessDiagram spec={parsedSpec} className={className} />;

    case 'flowchart':
    default:
      return <FlowchartDiagram spec={parsedSpec} className={className} />;
  }
};

export default DiagramRenderer;
