import React from 'react';
import { RMDDocument, ParseDiagnostic, MediaASTNode, AnnotationASTNode } from '@rmd/core';
import {
  Wrench,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Code2,
  FileCode,
  Zap
} from 'lucide-react';

interface AutoFixAction {
  title: string;
  description: string;
  applyFix: (source: string) => string;
}

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: RMDDocument;
  sourceCode: string;
  onApplyFix: (newSourceCode: string, fixTitle: string) => void;
}

export const DebugModal: React.FC<DebugModalProps> = ({
  isOpen,
  onClose,
  doc,
  sourceCode,
  onApplyFix
}) => {
  if (!isOpen) return null;

  const diagnostics = doc.diagnostics;
  const errors = diagnostics.filter((d) => d.level === 'error');
  const warnings = diagnostics.filter((d) => d.level === 'warning');

  // Collect available media IDs in the document
  const availableMedia = doc.nodes
    .filter((n) => n.type === 'rmd.media')
    .map((n) => (n as MediaASTNode).attrs);

  // Compute intelligent 1-click auto-fixes for a given diagnostic
  const getFixesForDiagnostic = (diag: ParseDiagnostic): AutoFixAction[] => {
    const fixes: AutoFixAction[] = [];

    const replaceInDiagRange = (src: string, replacer: (blockText: string) => string): string => {
      if (diag.range && diag.range.start.offset !== undefined && diag.range.end.offset !== undefined) {
        const before = src.slice(0, diag.range.start.offset);
        const blockText = src.slice(diag.range.start.offset, diag.range.end.offset);
        const after = src.slice(diag.range.end.offset);
        return before + replacer(blockText) + after;
      }
      return replacer(src);
    };

    // 1. Unknown Target (e.g. annotation points to non-existent asset)
    if (diag.code === 'ERR_UNKNOWN_TARGET') {
      const match = diag.message.match(/targets non-existent media asset (?:or annotation )?'([^']+)'/);
      const badTarget = match ? match[1] : '';

      if (availableMedia.length > 0) {
        for (const media of availableMedia) {
          fixes.push({
            title: `Point Target to '${media.id}' (${media.kind})`,
            description: `Change target from '${badTarget || 'unknown'}' to existing asset '${media.id}' in the document.`,
            applyFix: (src: string) => {
              return replaceInDiagRange(src, (block) => {
                let updated = block;
                if (badTarget) {
                  updated = updated.replace(
                    new RegExp(`target:\\s*${badTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
                    `target: ${media.id}`
                  );
                }
                if (media.kind === 'image') {
                  updated = updated.replace(/type:\s*temporal[\s\S]*?end:\s*[\d.]+/g, `type: xywh\n  unit: pixel\n  x: 100\n  y: 100\n  width: 300\n  height: 200`);
                  updated = updated.replace(/type:\s*quote/g, `type: object-region`);
                }
                return updated;
              });
            }
          });
        }
      } else {
        fixes.push({
          title: `Create Missing Media Asset for '${badTarget}'`,
          description: `Add a placeholder rmd:media block with id '${badTarget}' to satisfy the reference.`,
          applyFix: (src: string) => {
            const placeholder = `\n\`\`\`rmd:media\nid: ${badTarget || 'media-asset'}\nkind: image\nsrc: ./assets/${badTarget || 'asset'}.jpg\nmime: image/jpeg\nwidth: 1200\nheight: 800\n\`\`\`\n`;
            return src.trimEnd() + '\n' + placeholder;
          }
        });
      }
    }

    // 2. Incompatible Selector (e.g. temporal selector on image, or spatial on audio)
    if (diag.code === 'ERR_INCOMPATIBLE_SELECTOR') {
      if (diag.message.includes("allowed on 'video' or 'audio'") && diag.message.includes("'image'")) {
        fixes.push({
          title: `Convert Temporal Selector ➔ Spatial Bounding Box`,
          description: `Replace invalid temporal timecode with a valid spatial xywh pixel bounding box for image media.`,
          applyFix: (src: string) => {
            return replaceInDiagRange(src, (block) => {
              let updated = block.replace(/type:\s*temporal[\s\S]*?end:\s*[\d.]+/g, `type: xywh\n  unit: pixel\n  x: 100\n  y: 100\n  width: 300\n  height: 200`);
              updated = updated.replace(/type:\s*quote/g, `type: object-region`);
              return updated;
            });
          }
        });
      } else if (diag.message.includes("allowed on visual media") && diag.message.includes("'audio'")) {
        fixes.push({
          title: `Convert Spatial Selector ➔ Temporal Timecode`,
          description: `Replace spatial coordinates with a temporal start/end interval for audio media.`,
          applyFix: (src: string) => {
            return replaceInDiagRange(src, (block) => {
              return block.replace(/type:\s*xywh[\s\S]*?height:\s*[\d.]+/g, `type: temporal\n  start: 0.0\n  end: 10.0`);
            });
          }
        });
      }
    }

    // 3. Missing Front Matter ID
    if (diag.code === 'ERR_MISSING_DOC_ID') {
      fixes.push({
        title: `Add Document ID to Frontmatter`,
        description: `Insert a unique 'id: doc:my-document' into frontmatter.`,
        applyFix: (src: string) => {
          return src.replace(/^---\s*\n/m, `---\nid: doc:document-${Date.now().toString().slice(-4)}\n`);
        }
      });
    }

    // 4. Missing Spec Version
    if (diag.code === 'ERR_MISSING_RMD_VERSION') {
      fixes.push({
        title: `Add 'rmd: 0.1' Spec Version`,
        description: `Insert required 'rmd: 0.1' field at the top of frontmatter.`,
        applyFix: (src: string) => {
          return src.replace(/^---\s*\n/m, `---\nrmd: 0.1\n`);
        }
      });
    }

    // 5. Missing Document Title
    if (diag.code === 'ERR_MISSING_DOC_TITLE') {
      fixes.push({
        title: `Add Title to Frontmatter`,
        description: `Insert 'title: Rich Media Document' into frontmatter.`,
        applyFix: (src: string) => {
          return src.replace(/^---\s*\n/m, `---\ntitle: Rich Media Document\n`);
        }
      });
    }

    // 6. Duplicate ID
    if (diag.code === 'ERR_DUPLICATE_ID') {
      const match = diag.message.match(/'([^']+)'/);
      const dupId = match ? match[1] : '';
      if (dupId) {
        fixes.push({
          title: `Rename Duplicate ID '${dupId}' ➔ '${dupId}-2'`,
          description: `Automatically disambiguate the duplicate entity ID.`,
          applyFix: (src: string) => {
            let count = 0;
            return src.replace(new RegExp(`id:\\s*${dupId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), (m) => {
              count++;
              return count > 1 ? `id: ${dupId}-2` : m;
            });
          }
        });
      }
    }

    // 7. Missing Model Confidence
    if (diag.code === 'WARN_MISSING_MODEL_CONFIDENCE') {
      fixes.push({
        title: `Add Default 'confidence: 0.95'`,
        description: `Set confidence score to 0.95 on model-derived claim.`,
        applyFix: (src: string) => {
          return src.replace(/source:\s*model/g, `source: model\nconfidence: 0.95`);
        }
      });
    }

    return fixes;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                1-Click Debugger & Auto-Fix Center
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {errors.length} error(s), {warnings.length} warning(s) detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diagnostics List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {diagnostics.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="font-bold text-slate-200 text-sm">No Issues Found!</div>
              <p className="text-xs text-slate-400 font-mono">
                Your RMD document structure, media manifests, selectors, and schemas are 100% valid.
              </p>
            </div>
          ) : (
            diagnostics.map((diag, idx) => {
              const isError = diag.level === 'error';
              const fixes = getFixesForDiagnostic(diag);

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isError
                      ? 'bg-red-950/20 border-red-900/60'
                      : 'bg-amber-950/20 border-amber-900/60'
                  }`}
                >
                  {/* Diagnostic Title Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isError ? (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                      <span
                        className={`font-mono text-xs font-bold ${
                          isError ? 'text-red-300' : 'text-amber-300'
                        }`}
                      >
                        [{diag.code}]
                      </span>
                    </div>

                    {diag.range && (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                        Line {diag.range.start.line}:{diag.range.start.column}
                      </span>
                    )}
                  </div>

                  {/* Diagnostic Message */}
                  <p className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    {diag.message}
                  </p>

                  {/* 1-Click Auto Fix Actions */}
                  {fixes.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Available 1-Click Quick Fixes:
                      </div>

                      <div className="space-y-1.5">
                        {fixes.map((fix, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => {
                              const updated = fix.applyFix(sourceCode);
                              onApplyFix(updated, fix.title);
                              onClose();
                            }}
                            className="w-full p-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/80 hover:border-emerald-500 rounded-lg text-left transition flex items-center justify-between group shadow"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-xs font-mono text-emerald-300 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                {fix.title}
                              </div>
                              <div className="text-[11px] text-slate-400 font-sans">
                                {fix.description}
                              </div>
                            </div>

                            <div className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold font-mono text-xs rounded opacity-90 group-hover:opacity-100 flex items-center gap-1 shadow">
                              <span>Auto-Fix</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Clicking 'Auto-Fix' updates source code immediately</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
