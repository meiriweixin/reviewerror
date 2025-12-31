import React, { useEffect, useRef, useState, useCallback } from 'react';

// Lazy load mermaid to avoid SSR issues
let mermaidInstance = null;
const getMermaid = async () => {
  if (!mermaidInstance) {
    const mermaid = await import('mermaid');
    mermaidInstance = mermaid.default;
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#818cf8',
        primaryTextColor: '#1e1b4b',
        primaryBorderColor: '#6366f1',
        lineColor: '#6366f1',
        secondaryColor: '#c7d2fe',
        tertiaryColor: '#eef2ff',
        background: '#ffffff',
        fontSize: '14px',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
      securityLevel: 'loose',
    });
  }
  return mermaidInstance;
};

const MermaidDiagram = ({ code, className = '' }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const renderDiagram = useCallback(async () => {
    if (!code) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mermaid = await getMermaid();

      // Generate unique ID for this diagram
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Render the diagram
      const { svg } = await mermaid.render(id, code);
      setSvgContent(svg);
      setLoading(false);
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      console.error('Failed Mermaid code:', code);
      setError(`Diagram syntax error: ${err.message || 'Invalid syntax'}`);
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

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

  return (
    <div
      ref={containerRef}
      className={`mermaid-container bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default MermaidDiagram;
