import React, { useState } from 'react';
import { RMDDocument, RMDQueryEngine, formatSelector } from '@rmd/core';
import { Bot, Zap, Database, ArrowDown, CheckCircle2, ShieldCheck, Search, Cpu } from 'lucide-react';

interface AgentPreviewProps {
  doc: RMDDocument;
}

export const AgentPreview: React.FC<AgentPreviewProps> = ({ doc }) => {
  const engine = new RMDQueryEngine(doc);
  const graph = engine.getGraph();
  const savings = engine.calculateByteSavings();

  const [queryInput, setQueryInput] = useState('collapse');
  const [evidenceResults, setEvidenceResults] = useState(() => engine.findEvidence('collapse'));

  const handleSearch = (q: string) => {
    setQueryInput(q);
    setEvidenceResults(engine.findEvidence(q));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-200">
      {/* Agent Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Agent-Native Multi-Modal Evidence Layer
            </h2>
            <p className="text-xs text-slate-400">
              Retrieves minimal evidence slices without decoding raw gigabyte media files.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-mono font-bold text-emerald-400">
            {savings.savingsPercentage.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">Bandwidth Saved</div>
        </div>
      </div>

      {/* The Evidence Funnel Hierarchy */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          The Multi-Tier Retrieval Funnel:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Tier 1 */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-800/60 relative">
            <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase mb-1">
              Tier 1: Document Index
            </div>
            <div className="text-xs font-semibold text-white mb-1">Manifest & Summaries</div>
            <div className="text-[11px] text-slate-400">
              {(savings.metadataBytes / 1024).toFixed(1)} KB text parsed in &lt;1ms.
            </div>
            <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded inline-block">
              0 Bytes Media Loaded
            </div>
          </div>

          {/* Tier 2 */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-blue-800/60">
            <div className="text-[10px] font-mono text-blue-400 font-bold uppercase mb-1">
              Tier 2: Typed Anchors
            </div>
            <div className="text-xs font-semibold text-white mb-1">{graph.annotations.length} Evidence Selectors</div>
            <div className="text-[11px] text-slate-400">
              Exact timecodes & spatial bounding boxes indexed.
            </div>
          </div>

          {/* Tier 3 */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-purple-800/60">
            <div className="text-[10px] font-mono text-purple-400 font-bold uppercase mb-1">
              Tier 3: Targeted Slice
            </div>
            <div className="text-xs font-semibold text-white mb-1">Micro-Slice Only</div>
            <div className="text-[11px] text-slate-400">
              Extract only 12s clip or 400x300px crop if needed.
            </div>
          </div>

          {/* Tier 4 */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-red-900/40 opacity-75">
            <div className="text-[10px] font-mono text-red-400 font-bold uppercase mb-1">
              Tier 4: Raw Full Asset
            </div>
            <div className="text-xs font-semibold text-slate-300 mb-1">Full Inference Fallback</div>
            <div className="text-[11px] text-red-400 font-mono">
              Avoided {(savings.bytesSaved / (1024 * 1024)).toFixed(1)} MB decode
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Agent Retrieval Simulator */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Autonomous Evidence Query Test
            </h3>
          </div>

          <div className="flex gap-2">
            {['collapse', 'fracture', 'audio', 'perimeter'].map((preset) => (
              <button
                key={preset}
                onClick={() => handleSearch(preset)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={queryInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search claims, topics, entities..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Evidence Results */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-400">
            Resolved {evidenceResults.length} Evidence Slice(s):
          </div>

          {evidenceResults.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs font-mono bg-slate-950/50 rounded-lg border border-slate-800">
              No matching evidence slices found for query "{queryInput}". Try "collapse" or "fracture".
            </div>
          ) : (
            evidenceResults.map((slice) => (
              <div
                key={slice.annotationId}
                className="p-3 bg-slate-950 border border-emerald-900/60 rounded-lg space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">{slice.annotationId}</span>
                  <span className="text-slate-400">
                    Target: <code className="text-slate-200">{slice.targetAssetId}</code> ({slice.assetKind})
                  </span>
                </div>

                <div className="text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800 font-sans text-xs">
                  "{slice.claim}"
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>🎯 {formatSelector(slice.selector)}</span>
                  <span>Confidence: {((slice.confidence ?? 0.95) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
