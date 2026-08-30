import React from 'react';
import {
  FileCode,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Upload,
  Download,
  FilePlus2,
  Network
} from 'lucide-react';
import { ParseDiagnostic } from '@rmd/core';
import { EXAMPLES, ExampleDoc } from '../fixtures/examples';

interface EditorPaneProps {
  content: string;
  onChange: (value: string) => void;
  selectedExampleId: string;
  onSelectExample: (example: ExampleDoc) => void;
  diagnostics: ParseDiagnostic[];
  onOpenDropzone: () => void;
  onNewDocument: () => void;
  onDownloadRMD: () => void;
  onDownloadGraph: () => void;
  onOpenDebugger?: () => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  content,
  onChange,
  selectedExampleId,
  onSelectExample,
  diagnostics,
  onOpenDropzone,
  onNewDocument,
  onDownloadRMD,
  onDownloadGraph,
  onOpenDebugger
}) => {
  const lineCount = content.split('\n').length;
  const charCount = content.length;
  const errorCount = diagnostics.filter((d) => d.level === 'error').length;
  const warningCount = diagnostics.filter((d) => d.level === 'warning').length;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Primary Toolbar Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-300">
            Source Editor
          </span>
        </div>

        {/* Fixture Selector Dropdown */}
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={selectedExampleId}
            onChange={(e) => {
              const ex = EXAMPLES.find((x) => x.id === e.target.value);
              if (ex) onSelectExample(ex);
            }}
            className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDropzone}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded transition font-bold shadow-sm"
            title="Upload any image, video, audio, or .rmd file"
          >
            <Upload className="w-3 h-3" />
            + Import Media / File
          </button>

          <button
            onClick={onNewDocument}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition"
            title="Create a new empty RMD document"
          >
            <FilePlus2 className="w-3 h-3" />
            New
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onDownloadRMD}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition"
            title="Download .rmd file"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            .rmd
          </button>

          <button
            onClick={onDownloadGraph}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition"
            title="Download Agent Graph JSON"
          >
            <Network className="w-3 h-3 text-blue-400" />
            Graph
          </button>
        </div>
      </div>

      {/* Editor Textarea with Line Numbers */}
      <div className="flex-1 relative overflow-hidden flex bg-slate-950">
        {/* Line Numbers Bar */}
        <div className="w-10 py-3 pr-2 select-none text-right font-mono text-[11px] text-slate-600 bg-slate-950 border-r border-slate-900">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="leading-5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Main Code Editor */}
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 resize-none focus:outline-none overflow-y-auto whitespace-pre selection:bg-emerald-900 selection:text-emerald-100"
          placeholder="Write or paste your .rmd document here, or drop any media file..."
        />
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span>{charCount} chars</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">UTF-8 Plaintext</span>
        </div>

        <div className="flex items-center gap-2">
          {errorCount > 0 ? (
            <button
              onClick={onOpenDebugger}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold transition shadow-sm animate-pulse"
              title="Click for 1-Click Auto-Fix"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{errorCount} {errorCount === 1 ? 'error' : 'errors'}</span>
              <span className="text-[10px] text-red-200 underline ml-0.5">Auto-Fix</span>
            </button>
          ) : warningCount > 0 ? (
            <button
              onClick={onOpenDebugger}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 transition"
              title="Click to view warnings"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{warningCount} {warningCount === 1 ? 'warning' : 'warnings'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenDebugger}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
              title="Click to view validation details"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Syntax Valid
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
