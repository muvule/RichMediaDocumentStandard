import React, { useState } from 'react';
import { RMDDocument, toAgentGraph, RMDQueryEngine } from '@rmd/core';
import { Network, FileJson, Terminal, Copy, Check } from 'lucide-react';

interface GraphInspectorProps {
  doc: RMDDocument;
}

export const GraphInspector: React.FC<GraphInspectorProps> = ({ doc }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'ast' | 'context'>('graph');
  const [copied, setCopied] = useState(false);

  const graph = toAgentGraph(doc);
  const engine = new RMDQueryEngine(doc);
  const promptContext = engine.toPromptContext();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentContent =
    activeTab === 'graph'
      ? JSON.stringify(graph, null, 2)
      : activeTab === 'ast'
      ? JSON.stringify(doc.nodes, null, 2)
      : promptContext;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition ${
              activeTab === 'graph'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Agent Graph
          </button>

          <button
            onClick={() => setActiveTab('ast')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition ${
              activeTab === 'ast'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            AST Tree ({doc.nodes.length})
          </button>

          <button
            onClick={() => setActiveTab('context')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition ${
              activeTab === 'context'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            LLM Context
          </button>
        </div>

        {/* Copy Button */}
        <button
          onClick={() => handleCopy(currentContent)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code / Content Viewer */}
      <div className="flex-1 overflow-auto p-3 bg-slate-950 font-mono text-xs text-slate-300">
        <pre className="whitespace-pre leading-5 text-[11px] selection:bg-emerald-900">
          {currentContent}
        </pre>
      </div>
    </div>
  );
};
