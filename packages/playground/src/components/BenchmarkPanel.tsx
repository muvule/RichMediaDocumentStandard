import React from 'react';
import { RMDDocument, RMDQueryEngine, ParseDiagnostic } from '@rmd/core';
import { Activity, HardDrive, Zap, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface BenchmarkPanelProps {
  doc: RMDDocument;
  parseTimeMs: number;
  onOpenDebugger?: () => void;
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ doc, parseTimeMs, onOpenDebugger }) => {
  const engine = new RMDQueryEngine(doc);
  const savings = engine.calculateByteSavings();

  const errors = doc.diagnostics.filter((d) => d.level === 'error');
  const warnings = doc.diagnostics.filter((d) => d.level === 'warning');

  return (
    <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
      {/* 1. Parse Latency */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
        <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-mono">Parse Latency</div>
          <div className="text-base font-bold font-mono text-emerald-400">
            {parseTimeMs.toFixed(2)} ms
          </div>
          <div className="text-[10px] text-slate-500 font-mono">AST: {doc.nodes.length} nodes</div>
        </div>
      </div>

      {/* 2. Raw Media Avoided */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
        <div className="p-2 rounded bg-blue-500/10 text-blue-400">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-mono">Raw Media Avoided</div>
          <div className="text-base font-bold font-mono text-blue-400">
            {(savings.bytesSaved / (1024 * 1024)).toFixed(1)} MB
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Total Raw: {(savings.totalRawMediaBytes / (1024 * 1024)).toFixed(1)} MB
          </div>
        </div>
      </div>

      {/* 3. Bandwidth / Token Reduction */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
        <div className="p-2 rounded bg-purple-500/10 text-purple-400">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-mono">Bandwidth Reduction</div>
          <div className="text-base font-bold font-mono text-purple-400">
            {savings.savingsPercentage.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            ~{savings.estimatedInferenceSpeedupMultiplier}x agent speedup
          </div>
        </div>
      </div>

      {/* 4. Diagnostics Status (Clickable to open 1-Click Debugger) */}
      <div
        onClick={onOpenDebugger}
        className={`p-3 bg-slate-900 border rounded-lg flex items-center gap-3 cursor-pointer transition group shadow-sm ${
          errors.length > 0
            ? 'border-red-900/80 hover:border-red-500 hover:bg-red-950/20 ring-1 ring-red-500/20'
            : warnings.length > 0
            ? 'border-amber-900/80 hover:border-amber-500 hover:bg-amber-950/20'
            : 'border-slate-800 hover:border-emerald-500/60 hover:bg-slate-850'
        }`}
        title="Click to open 1-Click Debugger and Auto-Fix Center"
      >
        <div
          className={`p-2 rounded transition group-hover:scale-105 ${
            errors.length > 0
              ? 'bg-red-500/20 text-red-400'
              : warnings.length > 0
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {errors.length > 0 ? (
            <AlertCircle className="w-5 h-5" />
          ) : warnings.length > 0 ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Validation Status</span>
            {(errors.length > 0 || warnings.length > 0) && (
              <span className="text-[10px] text-emerald-400 font-bold underline group-hover:text-emerald-300">
                1-Click Fix ➔
              </span>
            )}
          </div>
          <div
            className={`text-base font-bold font-mono ${
              errors.length > 0
                ? 'text-red-400'
                : warnings.length > 0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {errors.length > 0
              ? `${errors.length} Error(s)`
              : warnings.length > 0
              ? `${warnings.length} Warning(s)`
              : 'Valid (0 errors)'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {errors.length > 0 ? 'Click to Auto-Fix' : doc.frontMatter.id}
          </div>
        </div>
      </div>
    </div>
  );
};
