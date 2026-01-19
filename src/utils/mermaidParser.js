/**
 * Mermaid to ReactFlow Parser
 * Converts Mermaid graph syntax to ReactFlow nodes and edges
 */

// Node shape patterns
const NODE_PATTERNS = {
  stadium: /^\(\[(.+?)\]\)$/,      // ([text])
  circle: /^\(\((.+?)\)\)$/,       // ((text))
  diamond: /^\{\{(.+?)\}\}$/,      // {{text}}
  parallelogram: /^\/(.+?)\/$/,    // /text/
  cylinder: /^\[\((.+?)\)\]$/,     // [(text)]
  rectangle: /^\[(.+?)\]$/,        // [text]
  default: /^(.+)$/,               // plain text
};

// Edge patterns
const EDGE_PATTERNS = [
  { pattern: /-->\s*\|(.+?)\|/, type: 'default', animated: false, hasLabel: true },
  { pattern: /-->\s*/, type: 'default', animated: false, hasLabel: false },
  { pattern: /---\s*\|(.+?)\|/, type: 'straight', animated: false, hasLabel: true },
  { pattern: /---\s*/, type: 'straight', animated: false, hasLabel: false },
  { pattern: /-\.->/, type: 'default', animated: true, hasLabel: false },
  { pattern: /==>/, type: 'default', animated: false, hasLabel: false, thick: true },
];

// Color palette for different node types
const NODE_COLORS = {
  stadium: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#5a67d8', text: '#ffffff' },
  circle: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: '#ed64a6', text: '#ffffff' },
  diamond: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#38b2ac', text: '#ffffff' },
  parallelogram: { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#48bb78', text: '#1a202c' },
  cylinder: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#ed8936', text: '#1a202c' },
  rectangle: { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', border: '#805ad5', text: '#1a202c' },
  default: { bg: 'linear-gradient(135deg, #e0e5ec 0%, #ffffff 100%)', border: '#a0aec0', text: '#2d3748' },
};

// Subject-specific color schemes
const SUBJECT_COLORS = {
  Physics: {
    primary: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#5a67d8', text: '#ffffff' },
    secondary: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#38b2ac', text: '#ffffff' },
    accent: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: '#ed64a6', text: '#ffffff' },
  },
  Mathematics: {
    primary: { bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: '#6366f1', text: '#ffffff' },
    secondary: { bg: 'linear-gradient(135deg, #c084fc 0%, #e879f9 100%)', border: '#a855f7', text: '#ffffff' },
    accent: { bg: 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%)', border: '#818cf8', text: '#1a202c' },
  },
  Chemistry: {
    primary: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '#10b981', text: '#ffffff' },
    secondary: { bg: 'linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)', border: '#34d399', text: '#1a202c' },
    accent: { bg: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', border: '#14b8a6', text: '#ffffff' },
  },
  Biology: {
    primary: { bg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: '#22c55e', text: '#ffffff' },
    secondary: { bg: 'linear-gradient(135deg, #84cc16 0%, #a3e635 100%)', border: '#84cc16', text: '#1a202c' },
    accent: { bg: 'linear-gradient(135deg, #4ade80 0%, #86efac 100%)', border: '#4ade80', text: '#1a202c' },
  },
  'Computer Science': {
    primary: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', border: '#3b82f6', text: '#ffffff' },
    secondary: { bg: 'linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)', border: '#60a5fa', text: '#1a202c' },
    accent: { bg: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', border: '#06b6d4', text: '#ffffff' },
  },
};

/**
 * Parse node text and extract ID, label, and shape
 */
function parseNode(nodeText) {
  const trimmed = nodeText.trim();

  // Try to match ID and content pattern: ID[content] or ID((content))
  const idMatch = trimmed.match(/^([A-Za-z0-9_]+)(.*)$/);

  if (!idMatch) {
    return { id: trimmed, label: trimmed, shape: 'default' };
  }

  const id = idMatch[1];
  const content = idMatch[2];

  if (!content) {
    return { id, label: id, shape: 'default' };
  }

  // Determine shape from content
  for (const [shape, pattern] of Object.entries(NODE_PATTERNS)) {
    const match = content.match(pattern);
    if (match) {
      return { id, label: match[1] || id, shape };
    }
  }

  return { id, label: id, shape: 'default' };
}

/**
 * Parse a connection line and extract source, target, and edge info
 */
function parseConnection(line) {
  // Find the edge pattern
  for (const edgeInfo of EDGE_PATTERNS) {
    const parts = line.split(edgeInfo.pattern);
    if (parts.length >= 2) {
      const sourceText = parts[0].trim();
      const targetText = parts[parts.length - 1].trim();

      // Extract label if present
      let label = '';
      if (edgeInfo.hasLabel) {
        const labelMatch = line.match(edgeInfo.pattern);
        if (labelMatch && labelMatch[1]) {
          label = labelMatch[1];
        }
      }

      const source = parseNode(sourceText);
      const target = parseNode(targetText);

      return {
        source,
        target,
        edge: {
          type: edgeInfo.type,
          animated: edgeInfo.animated,
          label,
          thick: edgeInfo.thick || false,
        },
      };
    }
  }

  return null;
}

/**
 * Parse subgraph definition
 */
function parseSubgraph(lines, startIndex) {
  const subgraphLine = lines[startIndex];
  const nameMatch = subgraphLine.match(/subgraph\s+(.+)/);
  const name = nameMatch ? nameMatch[1].trim() : 'Group';

  const children = [];
  let i = startIndex + 1;
  let depth = 1;

  while (i < lines.length && depth > 0) {
    const line = lines[i].trim();

    if (line.startsWith('subgraph')) {
      depth++;
    } else if (line === 'end') {
      depth--;
    } else if (depth === 1 && line) {
      children.push(line);
    }

    i++;
  }

  return { name, children, endIndex: i - 1 };
}

/**
 * Convert Mermaid code to ReactFlow nodes and edges
 */
export function parseMermaidToReactFlow(mermaidCode, subject = '') {
  if (!mermaidCode || typeof mermaidCode !== 'string') {
    return { nodes: [], edges: [] };
  }

  const lines = mermaidCode.split('\n').map(l => l.trim()).filter(l => l);
  const nodes = new Map();
  const edges = [];
  const subgraphs = [];

  // Determine direction from first line
  let direction = 'TB'; // Top to Bottom default
  const firstLine = lines[0] || '';
  if (firstLine.includes('LR')) direction = 'LR';
  else if (firstLine.includes('RL')) direction = 'RL';
  else if (firstLine.includes('BT')) direction = 'BT';

  // Get subject-specific colors
  const colors = SUBJECT_COLORS[subject] || SUBJECT_COLORS.Physics;

  // Process lines
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip graph declaration and end statements
    if (line.startsWith('graph') || line.startsWith('flowchart') || line === 'end') {
      i++;
      continue;
    }

    // Handle subgraph
    if (line.startsWith('subgraph')) {
      const subgraphInfo = parseSubgraph(lines, i);
      subgraphs.push({
        name: subgraphInfo.name,
        children: subgraphInfo.children,
      });
      i = subgraphInfo.endIndex + 1;
      continue;
    }

    // Parse connection
    const connection = parseConnection(line);
    if (connection) {
      // Add nodes if not exists
      if (!nodes.has(connection.source.id)) {
        nodes.set(connection.source.id, connection.source);
      }
      if (!nodes.has(connection.target.id)) {
        nodes.set(connection.target.id, connection.target);
      }

      // Add edge
      edges.push({
        id: `e${connection.source.id}-${connection.target.id}-${edges.length}`,
        source: connection.source.id,
        target: connection.target.id,
        label: connection.edge.label,
        type: connection.edge.type === 'straight' ? 'straight' : 'smoothstep',
        animated: connection.edge.animated,
        style: {
          strokeWidth: connection.edge.thick ? 3 : 2,
          stroke: '#6366f1',
        },
        labelStyle: {
          fill: '#4b5563',
          fontWeight: 500,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#6366f1',
        },
      });
    }

    i++;
  }

  // Process subgraph nodes
  subgraphs.forEach((sg) => {
    sg.children.forEach((childLine) => {
      const conn = parseConnection(childLine);
      if (conn) {
        if (!nodes.has(conn.source.id)) {
          nodes.set(conn.source.id, { ...conn.source, group: sg.name });
        }
        if (!nodes.has(conn.target.id)) {
          nodes.set(conn.target.id, { ...conn.target, group: sg.name });
        }
        edges.push({
          id: `e${conn.source.id}-${conn.target.id}-${edges.length}`,
          source: conn.source.id,
          target: conn.target.id,
          label: conn.edge.label,
          type: 'smoothstep',
          animated: conn.edge.animated,
          style: { strokeWidth: 2, stroke: '#6366f1' },
          markerEnd: { type: 'arrowclosed', color: '#6366f1' },
        });
      } else {
        // Single node in subgraph
        const nodeInfo = parseNode(childLine);
        if (!nodes.has(nodeInfo.id)) {
          nodes.set(nodeInfo.id, { ...nodeInfo, group: sg.name });
        }
      }
    });
  });

  // Calculate node positions
  const nodeArray = Array.from(nodes.values());
  const nodePositions = calculateNodePositions(nodeArray, edges, direction);

  // Create ReactFlow nodes with styling
  const reactFlowNodes = nodeArray.map((node, index) => {
    const position = nodePositions[node.id] || { x: index * 200, y: index * 100 };
    const colorIndex = index % 3;
    const colorKey = ['primary', 'secondary', 'accent'][colorIndex];
    const nodeColor = colors[colorKey] || NODE_COLORS[node.shape] || NODE_COLORS.default;

    return {
      id: node.id,
      type: 'custom',
      position,
      data: {
        label: node.label,
        shape: node.shape,
        group: node.group,
        colors: nodeColor,
      },
    };
  });

  return {
    nodes: reactFlowNodes,
    edges,
    direction,
  };
}

/**
 * Calculate node positions using a simple layout algorithm
 */
function calculateNodePositions(nodes, edges, direction) {
  const positions = {};
  const nodeCount = nodes.length;

  if (nodeCount === 0) return positions;

  // Build adjacency list
  const adjacency = {};
  const inDegree = {};

  nodes.forEach((node) => {
    adjacency[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach((edge) => {
    if (adjacency[edge.source]) {
      adjacency[edge.source].push(edge.target);
    }
    if (inDegree[edge.target] !== undefined) {
      inDegree[edge.target]++;
    }
  });

  // Topological sort for layered layout
  const layers = [];
  const visited = new Set();
  const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);

  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
  }

  while (queue.length > 0) {
    const layer = [];
    const nextQueue = [];

    queue.forEach((nodeId) => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        layer.push(nodeId);

        (adjacency[nodeId] || []).forEach((targetId) => {
          inDegree[targetId]--;
          if (inDegree[targetId] === 0) {
            nextQueue.push(targetId);
          }
        });
      }
    });

    if (layer.length > 0) {
      layers.push(layer);
    }
    queue.length = 0;
    queue.push(...nextQueue);
  }

  // Add remaining unvisited nodes
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      layers.push([node.id]);
      visited.add(node.id);
    }
  });

  // Calculate positions based on layers
  const nodeWidth = 160;
  const nodeHeight = 60;
  const horizontalSpacing = 80;
  const verticalSpacing = 100;

  const isHorizontal = direction === 'LR' || direction === 'RL';

  layers.forEach((layer, layerIndex) => {
    layer.forEach((nodeId, nodeIndex) => {
      const layerOffset = layer.length * (isHorizontal ? nodeHeight + verticalSpacing : nodeWidth + horizontalSpacing) / 2;

      if (isHorizontal) {
        positions[nodeId] = {
          x: layerIndex * (nodeWidth + horizontalSpacing),
          y: nodeIndex * (nodeHeight + verticalSpacing) - layerOffset / 2 + (nodeHeight + verticalSpacing) / 2,
        };
      } else {
        positions[nodeId] = {
          x: nodeIndex * (nodeWidth + horizontalSpacing) - layerOffset / 2 + (nodeWidth + horizontalSpacing) / 2,
          y: layerIndex * (nodeHeight + verticalSpacing),
        };
      }

      // Reverse for RL or BT
      if (direction === 'RL') {
        positions[nodeId].x = (layers.length - 1 - layerIndex) * (nodeWidth + horizontalSpacing);
      } else if (direction === 'BT') {
        positions[nodeId].y = (layers.length - 1 - layerIndex) * (nodeHeight + verticalSpacing);
      }
    });
  });

  return positions;
}

export default parseMermaidToReactFlow;
