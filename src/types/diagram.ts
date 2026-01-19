/**
 * Diagram Type Definitions
 * For exam-paper style scientific diagrams
 */

// Base position type
export interface Position {
  x: number;
  y: number;
}

// Main diagram specification
export interface DiagramSpec {
  type: DiagramType;
  title?: string;
  width?: number;
  height?: number;
  elements: DiagramElement[];
  connections?: Connection[];
  annotations?: Annotation[];
}

export type DiagramType =
  | 'physics_circuit'
  | 'physics_force'
  | 'physics_optics'
  | 'chemistry_structure'
  | 'chemistry_reaction'
  | 'math_geometry'
  | 'math_graph'
  | 'math_tree'
  | 'biology_process'
  | 'biology_cell'
  | 'flowchart';

// Union type for all diagram elements
export type DiagramElement =
  | CircuitElement
  | ForceElement
  | OpticsElement
  | MoleculeElement
  | GeometryElement
  | GraphElement
  | BiologyElement
  | FlowchartElement;

// ============================================
// PHYSICS - Circuit Elements
// ============================================
export interface CircuitElement {
  id: string;
  type: CircuitComponentType;
  position: Position;
  rotation?: number; // degrees, default 0
  value?: string; // e.g., "6V", "10Ω"
  label?: string;
  state?: 'open' | 'closed'; // for switches
}

export type CircuitComponentType =
  | 'battery'
  | 'cell'
  | 'bulb'
  | 'resistor'
  | 'switch'
  | 'ammeter'
  | 'voltmeter'
  | 'capacitor'
  | 'diode'
  | 'led'
  | 'motor'
  | 'bell'
  | 'fuse'
  | 'wire'
  | 'junction';

// ============================================
// PHYSICS - Force Elements
// ============================================
export interface ForceElement {
  id: string;
  type: ForceComponentType;
  position: Position;
  // For objects
  shape?: 'rectangle' | 'circle' | 'triangle' | 'irregular';
  width?: number;
  height?: number;
  // For vectors
  magnitude?: number;
  direction?: number; // degrees: 0=right, 90=up, 180=left, 270=down
  label?: string;
  color?: string;
  // For surfaces
  length?: number;
  angle?: number;
  // For angles
  vertex?: Position;
  ray1End?: Position;
  ray2End?: Position;
  angleDegrees?: number;
}

export type ForceComponentType =
  | 'object'
  | 'force_vector'
  | 'surface'
  | 'pivot'
  | 'angle_arc'
  | 'spring'
  | 'pulley'
  | 'rope';

// ============================================
// PHYSICS - Optics Elements
// ============================================
export interface OpticsElement {
  id: string;
  type: OpticsComponentType;
  position: Position;
  // For mirrors/lenses
  curvature?: 'concave' | 'convex' | 'flat';
  focalLength?: number;
  height?: number;
  // For rays
  start?: Position;
  end?: Position;
  rayType?: 'incident' | 'reflected' | 'refracted';
  // For points
  label?: string;
}

export type OpticsComponentType =
  | 'mirror'
  | 'lens'
  | 'ray'
  | 'object_point'
  | 'image_point'
  | 'focal_point'
  | 'principal_axis'
  | 'normal_line';

// ============================================
// CHEMISTRY - Molecule Elements
// ============================================
export interface MoleculeElement {
  id: string;
  type: MoleculeComponentType;
  position?: Position;
  // For atoms
  symbol?: string; // "C", "H", "O", "N", etc.
  charge?: number; // +1, -1, etc.
  // For bonds
  bondType?: 'single' | 'double' | 'triple' | 'dashed' | 'wedge';
  from?: string; // atom id
  to?: string; // atom id
  // For electron pairs
  direction?: number;
}

export type MoleculeComponentType =
  | 'atom'
  | 'bond'
  | 'electron_pair'
  | 'lone_pair'
  | 'charge'
  | 'bracket'; // for ions

// ============================================
// MATH - Geometry Elements
// ============================================
export interface GeometryElement {
  id: string;
  type: GeometryComponentType;
  // For points
  position?: Position;
  label?: string;
  // For lines/segments
  start?: Position;
  end?: Position;
  // For angles
  vertex?: Position;
  ray1End?: Position;
  ray2End?: Position;
  angleDegrees?: number;
  showArc?: boolean;
  // For circles
  center?: Position;
  radius?: number;
  // For polygons
  vertices?: Position[];
  // For arcs
  startAngle?: number;
  endAngle?: number;
  // Style
  dashed?: boolean;
  showMeasurement?: boolean;
}

export type GeometryComponentType =
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'angle'
  | 'arc'
  | 'circle'
  | 'triangle'
  | 'rectangle'
  | 'square'
  | 'polygon'
  | 'parallel_mark'
  | 'perpendicular_mark'
  | 'equal_mark';

// ============================================
// MATH - Graph Elements
// ============================================
export interface GraphElement {
  id: string;
  type: GraphComponentType;
  // For axes
  start?: Position;
  end?: Position;
  label?: string;
  // For points
  position?: Position;
  // For curves/lines
  points?: Position[];
  equation?: string;
  // For circles
  radius?: number;
  // For regions
  fillColor?: string;
  // Grid
  spacing?: number;
}

export type GraphComponentType =
  | 'x_axis'
  | 'y_axis'
  | 'grid'
  | 'point'
  | 'line'
  | 'curve'
  | 'parabola'
  | 'circle'
  | 'asymptote'
  | 'shaded_region'
  | 'arrow';

// ============================================
// BIOLOGY - Elements
// ============================================
export interface BiologyElement {
  id: string;
  type: BiologyComponentType;
  position: Position;
  width?: number;
  height?: number;
  label?: string;
  // For cells
  shape?: 'rectangular' | 'circular' | 'irregular';
  // For organelles
  organelleType?: string;
  // For arrows in processes
  direction?: number;
  magnitude?: number;
}

export type BiologyComponentType =
  | 'cell'
  | 'cell_membrane'
  | 'nucleus'
  | 'mitochondria'
  | 'chloroplast'
  | 'vacuole'
  | 'ribosome'
  | 'organism'
  | 'arrow'
  | 'label_box';

// ============================================
// FLOWCHART - Generic Elements
// ============================================
export interface FlowchartElement {
  id: string;
  type: FlowchartComponentType;
  position: Position;
  label?: string;
  width?: number;
  height?: number;
}

export type FlowchartComponentType =
  | 'box'
  | 'diamond'
  | 'oval'
  | 'parallelogram'
  | 'start_end'
  | 'process'
  | 'decision'
  | 'input_output'
  | 'connector';

// ============================================
// CONNECTIONS
// ============================================
export interface Connection {
  from: string; // element id
  to: string; // element id
  fromPort?: 'top' | 'bottom' | 'left' | 'right';
  toPort?: 'top' | 'bottom' | 'left' | 'right';
  type?: 'wire' | 'arrow' | 'line' | 'dashed' | 'double_arrow';
  label?: string;
  labelPosition?: 'start' | 'middle' | 'end';
  // For curved connections
  curved?: boolean;
  controlPoints?: Position[];
}

// ============================================
// ANNOTATIONS
// ============================================
export interface Annotation {
  id?: string;
  text: string;
  position: Position;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAnchor?: 'start' | 'middle' | 'end';
  rotation?: number;
}

// ============================================
// SYMBOL PROPS (for SVG components)
// ============================================
export interface SymbolProps {
  x: number;
  y: number;
  rotation?: number;
  label?: string;
  value?: string;
  state?: 'open' | 'closed';
  scale?: number;
}

export interface VectorProps {
  x: number;
  y: number;
  direction: number;
  magnitude: number;
  label?: string;
  color?: string;
  strokeWidth?: number;
}
