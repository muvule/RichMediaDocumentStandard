import React from 'react';
import {
  RMDDocument,
  MediaASTNode,
  AnnotationASTNode,
  SemanticASTNode,
  ProvenanceASTNode,
  AgentASTNode,
  formatSelector
} from '@rmd/core';
import { MediaOverlay } from './MediaOverlay';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';
import { AssetFilmstrip } from './AssetFilmstrip';
import {
  ShieldCheck,
  Tag,
  User,
  Calendar,
  Layers,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Upload,
  Image,
  Video,
  Music,
  Trash2,
  Target
} from 'lucide-react';

interface HumanPreviewProps {
  doc: RMDDocument;
  selectedAnnotationId?: string;
  onSelectAnnotation?: (id: string) => void;
  selectedAssetId?: string;
  onSelectAsset?: (id?: string) => void;
  onDeleteAsset?: (id: string) => void;
  onAddAnnotation?: (ann: any) => void;
  onOpenDropzone?: () => void;
}

export const HumanPreview: React.FC<HumanPreviewProps> = ({
  doc,
  selectedAnnotationId,
  onSelectAnnotation,
  selectedAssetId,
  onSelectAsset,
  onDeleteAsset,
  onAddAnnotation,
  onOpenDropzone
}) => {
  const { frontMatter, nodes } = doc;
  
  // Extract all media assets
  const mediaNodes = nodes.filter((n) => n.type === 'rmd.media') as MediaASTNode[];
  const allAssets = mediaNodes.map((n) => n.attrs);

  // Extract all annotations for media overlays
  const allAnnotations = nodes
    .filter((n) => n.type === 'rmd.annotation')
    .map((n) => (n as AnnotationASTNode).attrs);

  const hasMedia = mediaNodes.length > 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Multi-Asset Filmstrip Bar */}
      {hasMedia && onSelectAsset && onOpenDropzone && (
        <AssetFilmstrip
          assets={allAssets}
          annotations={allAnnotations}
          selectedAssetId={selectedAssetId}
          onSelectAsset={onSelectAsset}
          onOpenDropzone={onOpenDropzone}
        />
      )}

      <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-200 w-full flex-1">
        {/* Front Matter Document Header */}
        <div className="border-b border-slate-800 pb-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-xs font-semibold">
              RMD v{frontMatter.rmd || '0.1'}
            </span>
            {frontMatter.contentType && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs uppercase">
                {frontMatter.contentType}
              </span>
            )}
            <span className="text-slate-500 font-mono text-xs ml-auto">ID: {frontMatter.id}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">{frontMatter.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {frontMatter.authors && frontMatter.authors.length > 0 && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{frontMatter.authors.map((a) => a.name).join(', ')}</span>
              </div>
            )}

            {frontMatter.created && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(frontMatter.created).toLocaleDateString()}</span>
              </div>
            )}

            {frontMatter.license && (
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{frontMatter.license}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {frontMatter.tags && frontMatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {frontMatter.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded text-[11px] font-mono border border-slate-700/60"
                >
                  <Tag className="w-2.5 h-2.5 text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sequential AST Node Rendering */}
        <div className="space-y-6">
          {nodes.map((node) => {
            switch (node.type) {
              case 'rmd.markdown': {
                return (
                  <div key={node.id} className="space-y-6">
                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-sans text-sm space-y-2 whitespace-pre-wrap">
                      {node.raw}
                    </div>

                    {!hasMedia && onOpenDropzone && (
                      <div
                        onClick={onOpenDropzone}
                        className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/60 hover:bg-emerald-950/10 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 my-4 group shadow-lg"
                      >
                        <div className="flex gap-2 text-slate-400 group-hover:scale-105 transition">
                          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700"><Image className="w-5 h-5 text-emerald-400" /></div>
                          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700"><Video className="w-5 h-5 text-blue-400" /></div>
                          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700"><Music className="w-5 h-5 text-purple-400" /></div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5">
                            <Upload className="w-4 h-4 text-emerald-400" />
                            Import Media to Generate RMD Blocks
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            Click to browse or drop any image (PNG, JPG), video (MP4), or audio (MP3) file
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              case 'rmd.media': {
                const mediaNode = node as MediaASTNode;
                const m = mediaNode.attrs;
                const isCardFocused = selectedAssetId === m.id;
                const isFilteredOut = selectedAssetId && selectedAssetId !== m.id;

                if (isFilteredOut) return null;

                return (
                  <div
                    key={node.id}
                    className={`space-y-2 rounded-xl p-3 bg-slate-900/60 border transition ${
                      isCardFocused
                        ? 'border-emerald-500/80 shadow-lg ring-1 ring-emerald-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Media Card Top Header Action Utility Bar */}
                    <div className="flex items-center justify-between px-2 py-1 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="font-bold text-slate-200">{m.id}</span>
                        <span className="text-slate-500">[{m.kind.toUpperCase()}]</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onDeleteAsset && (
                          <button
                            onClick={() => onDeleteAsset(m.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-red-400 hover:bg-red-950/60 hover:text-red-300 border border-transparent hover:border-red-900/60 transition"
                            title="Remove asset and orphaned annotations from document"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {m.kind === 'image' && (
                      <MediaOverlay
                        media={m}
                        annotations={allAnnotations}
                        selectedAnnotationId={selectedAnnotationId}
                        onSelectAnnotation={onSelectAnnotation}
                        onAddAnnotation={onAddAnnotation}
                      />
                    )}

                    {m.kind === 'video' && (
                      <VideoPlayer
                        media={m}
                        annotations={allAnnotations}
                        selectedAnnotationId={selectedAnnotationId}
                        onSelectAnnotation={onSelectAnnotation}
                        onAddAnnotation={onAddAnnotation}
                      />
                    )}

                    {m.kind === 'audio' && (
                      <AudioPlayer
                        media={m}
                        annotations={allAnnotations}
                        selectedAnnotationId={selectedAnnotationId}
                        onSelectAnnotation={onSelectAnnotation}
                        onAddAnnotation={onAddAnnotation}
                      />
                    )}

                    {/* Summary Callout if present */}
                    {m.understanding && (m.understanding as { summary?: string }).summary && (
                      <p className="text-xs text-slate-400 italic px-2 pt-1">
                        💡 {(m.understanding as { summary: string }).summary}
                      </p>
                    )}
                  </div>
                );
              }

              case 'rmd.annotation': {
                const annNode = node as AnnotationASTNode;
                const a = annNode.attrs;
                const isSelected = selectedAnnotationId === a.id;
                const isFilteredOut = selectedAssetId && selectedAssetId !== a.target;

                if (isFilteredOut) return null;

                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectAnnotation?.(a.id)}
                    className={`p-3.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="font-bold text-emerald-300">{a.id}</span>
                        <span className="text-slate-500">➔ target:</span>
                        <span className="text-slate-300 font-semibold">{a.target}</span>
                      </div>

                      {a.confidence !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                          {((a.confidence) * 100).toFixed(0)}% Conf
                        </span>
                      )}
                    </div>

                    {a.claim && (
                      <div className="text-sm font-medium text-slate-100 mb-1 font-sans">
                        "{a.claim}"
                      </div>
                    )}

                    {a.selector && (
                      <div className="text-xs font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded inline-block border border-slate-800">
                        🎯 Selector: {formatSelector(a.selector)}
                      </div>
                    )}
                  </div>
                );
              }

              case 'rmd.semantic': {
                const semNode = node as SemanticASTNode;
                const s = semNode.attrs;

                return (
                  <div key={node.id} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-purple-300">{s.id}</span>
                      <span>(Semantic Index for \`{s.target}\`)</span>
                    </div>

                    {s.summary && <p className="text-xs text-slate-300">{s.summary}</p>}

                    {s.entities && s.entities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.entities.map((ent) => (
                          <span
                            key={ent.id}
                            className="px-2 py-0.5 bg-purple-950/60 text-purple-300 rounded text-xs font-mono border border-purple-800/60"
                          >
                            {ent.label} <span className="text-purple-500">({ent.type || 'entity'})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              case 'rmd.provenance': {
                const provNode = node as ProvenanceASTNode;
                const p = provNode.attrs;

                return (
                  <div key={node.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-mono text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-300">C2PA & Provenance Audit Ledger</span>
                      {p.c2pa && <span className="text-emerald-400 font-mono">[{p.c2pa}]</span>}
                    </div>

                    {p.history && (
                      <div className="space-y-1 pl-4 border-l border-slate-800">
                        {p.history.map((h, idx) => (
                          <div key={idx} className="text-slate-400 font-mono text-[11px]">
                            <span className="text-emerald-400 font-bold">{h.action}</span>
                            {h.at && <span className="text-slate-500"> at {new Date(h.at).toLocaleTimeString()}</span>}
                            {h.actor && <span className="text-slate-400"> by {h.actor}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
};
