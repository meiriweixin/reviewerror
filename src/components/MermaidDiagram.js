import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#818cf8',      // indigo-400
    primaryTextColor: '#1e1b4b',  // indigo-950
    primaryBorderColor: '#6366f1', // indigo-500
    lineColor: '#6366f1',         // indigo-500
    secondaryColor: '#c7d2fe',    // indigo-200
    tertiaryColor: '#eef2ff',     // indigo-50
    background: '#ffffff',
    fontSize: '14px',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
  securityLevel: 'strict',
});

const MermaidDiagram = ({ code, className = '' }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code || !containerRef.current) return;

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';
        setError(null);

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Validate and render the diagram
        const isValid = await mermaid.parse(code);
        if (isValid) {
          const { svg } = await mermaid.render(id, code);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            setRendered(true);
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
        setRendered(false);
      }
    };

    renderDiagram();
  }, [code]);

  if (!code) return null;

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 overflow-x-auto ${className}`}
      style={{ minHeight: rendered ? 'auto' : '100px' }}
    >
      {!rendered && (
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
};

export default MermaidDiagram;
