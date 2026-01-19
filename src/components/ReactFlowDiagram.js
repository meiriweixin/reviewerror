import React, { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { parseMermaidToReactFlow } from '../utils/mermaidParser';

// Custom Node Component with beautiful styling
const CustomNode = ({ data }) => {
  const { label, shape, colors } = data;

  // Get node style based on shape
  const getNodeStyle = () => {
    const baseStyle = {
      background: colors?.bg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: colors?.text || '#ffffff',
      border: `2px solid ${colors?.border || '#5a67d8'}`,
      padding: '12px 20px',
      minWidth: '120px',
      textAlign: 'center',
      fontWeight: 500,
      fontSize: '13px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), 0 2px 5px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.2s ease',
    };

    switch (shape) {
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: '50%',
          minWidth: '80px',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '15px',
        };
      case 'diamond':
        return {
          ...baseStyle,
          borderRadius: '8px',
          transform: 'rotate(45deg)',
          minWidth: '70px',
          minHeight: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };
      case 'stadium':
        return {
          ...baseStyle,
          borderRadius: '30px',
          padding: '12px 24px',
        };
      case 'parallelogram':
        return {
          ...baseStyle,
          borderRadius: '8px',
          transform: 'skewX(-10deg)',
        };
      case 'cylinder':
        return {
          ...baseStyle,
          borderRadius: '20px 20px 8px 8px',
          borderTop: `6px solid ${colors?.border || '#5a67d8'}`,
        };
      default:
        return {
          ...baseStyle,
          borderRadius: '12px',
        };
    }
  };

  const getLabelStyle = () => {
    if (shape === 'diamond') {
      return { transform: 'rotate(-45deg)', display: 'block' };
    }
    if (shape === 'parallelogram') {
      return { transform: 'skewX(10deg)', display: 'block' };
    }
    return {};
  };

  return (
    <div style={getNodeStyle()} className="hover:scale-105 cursor-pointer">
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors?.border || '#5a67d8',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <span style={getLabelStyle()}>{label}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors?.border || '#5a67d8',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      {/* Left and Right handles for horizontal layouts */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: colors?.border || '#5a67d8',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: colors?.border || '#5a67d8',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Default edge options with beautiful styling
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: {
    strokeWidth: 2,
    stroke: '#6366f1',
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1',
    width: 20,
    height: 20,
  },
};

const ReactFlowDiagram = ({ code, subject = '', className = '' }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse Mermaid code to ReactFlow format
  const parsedData = useMemo(() => {
    try {
      setError(null);
      const result = parseMermaidToReactFlow(code, subject);
      return result;
    } catch (err) {
      console.error('Failed to parse Mermaid code:', err);
      setError(`Failed to parse diagram: ${err.message}`);
      return { nodes: [], edges: [], direction: 'TB' };
    }
  }, [code, subject]);

  const [nodes, setNodes, onNodesChange] = useNodesState(parsedData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsedData.edges);

  // Update nodes and edges when parsed data changes
  useEffect(() => {
    setNodes(parsedData.nodes);
    setEdges(parsedData.edges);
    setLoading(false);
  }, [parsedData, setNodes, setEdges]);

  // Calculate container height based on number of nodes
  const containerHeight = useMemo(() => {
    const baseHeight = 200;
    const nodeCount = parsedData.nodes.length;
    return Math.min(Math.max(baseHeight, nodeCount * 60), 400);
  }, [parsedData.nodes.length]);

  // Handle empty or invalid code
  if (!code) return null;

  if (error) {
    return (
      <div className={`bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        <span className="italic">{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 ${className}`}>
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (parsedData.nodes.length === 0) {
    return (
      <div className={`bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        <span className="italic">No diagram data available</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden shadow-sm ${className}`}
      style={{ height: containerHeight }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.3,
          includeHiddenNodes: false,
        }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
      >
        <Background
          variant="dots"
          gap={20}
          size={1}
          color="#c7d2fe"
          className="dark:opacity-30"
        />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="top-right"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default ReactFlowDiagram;
