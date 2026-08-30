import React, { useState, useMemo, useEffect } from 'react';
import { parseRMD, RMDDocument, toAgentGraph, MediaBlockAttrs, SpatialSelector, TemporalSelector, MediaASTNode } from '@rmd/core';
import { EXAMPLES, ExampleDoc } from './fixtures/examples';
import { EditorPane } from './components/EditorPane';
import { HumanPreview } from './components/HumanPreview';
import { AgentPreview } from './components/AgentPreview';
import { GraphInspector } from './components/GraphInspector';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { MediaDropzone } from './components/MediaDropzone';
import { DebugModal } from './components/DebugModal';
import { LandingPage } from './components/LandingPage';
import {
  Bot,
  User,
  Upload,
  CheckCircle2,
  Wrench,
  BookOpen
} from 'lucide-react';

export function App() {
  const [activeAppTab, setActiveAppTab] = useState<'article' | 'studio'>(() =>
    window.location.hash === '#studio' ? 'studio' : 'article'
  );
  const [selectedExample, setSelectedExample] = useState<ExampleDoc>(EXAMPLES[0]);
  const [sourceCode, setSourceCode] = useState<string>(EXAMPLES[0].content);
  const [viewMode, setViewMode] = useState<'human' | 'agent'>('human');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>(undefined);
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(undefined);
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync activeAppTab with URL hash for deep-linking
  useEffect(() => {
    window.location.hash = activeAppTab === 'studio' ? '#studio' : '';
  }, [activeAppTab]);

  useEffect(() => {
    const onHashChange = () => {
      setActiveAppTab(window.location.hash === '#studio' ? 'studio' : 'article');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Parse document in real time and measure latency
  const { doc, parseTimeMs } = useMemo(() => {
    const t0 = performance.now();
    const parsed = parseRMD(sourceCode);
    const elapsed = performance.now() - t0;
    return { doc: parsed, parseTimeMs: elapsed };
  }, [sourceCode]);

  const hasExistingMedia = useMemo(() => {
    return doc.nodes.some((n) => n.type === 'rmd.media');
  }, [doc]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectExample = (ex: ExampleDoc) => {
    setSelectedExample(ex);
    setSourceCode(ex.content);
    setSelectedAnnotationId(undefined);
    setSelectedAssetId(undefined);
  };

  const handleNewDocument = () => {
    const newDocId = `doc:custom-${Date.now().toString().slice(-4)}`;
    const template = `---
rmd: 0.1
id: ${newDocId}
title: Untitled Rich Media Document
language: en
license: CC-BY-4.0
---

# Untitled Rich Media Document

Upload or drop any image, video, or audio file to generate RMD media manifests.
`;
    setSourceCode(template);
    setSelectedExample({
      id: 'custom',
      name: 'Custom User Document',
      kind: 'custom',
      description: 'Custom document created in session.',
      content: template
    });
    setSelectedAnnotationId(undefined);
    setSelectedAssetId(undefined);
    showToast('Created new empty RMD document');
  };

  const handleAddMedia = (media: MediaBlockAttrs, importMode: 'append' | 'replace' | 'new' = 'append') => {
    const lines: string[] = [];

    // Format the new media block
    const mediaBlockLines = [
      '```rmd:media',
      `id: ${media.id}`,
      `kind: ${media.kind}`,
      `src: ${media.src}`,
      `mime: ${media.mime}`
    ];
    if (media.byteSize) mediaBlockLines.push(`byteSize: ${media.byteSize}`);
    if (media.width) mediaBlockLines.push(`width: ${media.width}`);
    if (media.height) mediaBlockLines.push(`height: ${media.height}`);
    if (media.duration) mediaBlockLines.push(`duration: ${media.duration}`);
    if (media.understanding && typeof media.understanding === 'object') {
      const summary = (media.understanding as { summary?: string }).summary;
      if (summary) {
        mediaBlockLines.push('understanding:');
        mediaBlockLines.push(`  summary: "${summary.replace(/"/g, '\\"')}"`);
      }
    }
    mediaBlockLines.push('```');

    // Starter annotation
    const starterAnnId = `ann-${media.id}-anchor`;
    const starterAnnLines: string[] = [];
    if (media.kind === 'audio') {
      starterAnnLines.push(
        '',
        '```rmd:annotation',
        `id: ${starterAnnId}`,
        `target: ${media.id}`,
        'type: quote',
        'selector:',
        '  type: temporal',
        '  start: 0.0',
        `  end: ${Math.min(10.0, media.duration || 10.0)}`,
        'claim: "Initial key audio segment."',
        'confidence: 0.95',
        'source: human',
        '```'
      );
    } else if (media.kind === 'video') {
      starterAnnLines.push(
        '',
        '```rmd:annotation',
        `id: ${starterAnnId}`,
        `target: ${media.id}`,
        'type: evidence',
        'selector:',
        '  type: temporal',
        '  start: 0.0',
        `  end: ${Math.min(15.0, media.duration || 15.0)}`,
        'claim: "Opening scene interval in video recording."',
        'confidence: 0.95',
        'source: human',
        '```'
      );
    }

    if (importMode === 'new') {
      const newDocId = `doc:${media.id}-${Date.now().toString().slice(-4)}`;
      const newContent = `---
rmd: 0.1
id: ${newDocId}
title: ${media.id.toUpperCase()} Report
language: en
license: CC-BY-4.0
---

# ${media.id.toUpperCase()} Report

${mediaBlockLines.join('\n')}
${starterAnnLines.join('\n')}
`;
      setSourceCode(newContent);
      setSelectedExample({
        id: `doc-${media.id}`,
        name: `Asset: ${media.id}`,
        kind: media.kind,
        description: `Dedicated document for ${media.id}`,
        content: newContent
      });
      setSelectedAssetId(media.id);
      setSelectedAnnotationId(starterAnnId);
      showToast(`Created fresh document for ${media.id}`);
      return;
    }

    if (importMode === 'replace') {
      // Replace existing media in current source
      const firstMediaNode = doc.nodes.find((n) => n.type === 'rmd.media') as MediaASTNode | undefined;
      if (firstMediaNode) {
        const oldRaw = firstMediaNode.raw;
        const newCode = sourceCode.replace(oldRaw, mediaBlockLines.join('\n'));
        setSourceCode(newCode);
        setSelectedAssetId(media.id);
        showToast(`Replaced media asset with ${media.id}`);
        return;
      }
    }

    // Default 'append' mode: Append with clean Markdown section header
    lines.push(
      '',
      `## Attached Evidence: ${media.id}`,
      '',
      mediaBlockLines.join('\n'),
      starterAnnLines.join('\n'),
      ''
    );

    setSourceCode((prev) => prev.trimEnd() + '\n' + lines.join('\n'));
    setSelectedAssetId(media.id);
    setSelectedAnnotationId(starterAnnId);
    showToast(`Appended ${media.kind.toUpperCase()} asset '${media.id}' to document`);
  };

  const handleDeleteAsset = (assetId: string) => {
    // Filter out the media node and annotations targeting assetId from raw source
    const targetMedia = doc.nodes.find((n) => n.type === 'rmd.media' && (n as MediaASTNode).attrs.id === assetId);
    if (!targetMedia) return;

    let newCode = sourceCode;
    // Remove all related annotations
    for (const node of doc.nodes) {
      if (node.type === 'rmd.annotation' && (node as any).attrs.target === assetId) {
        newCode = newCode.replace(node.raw, '');
      }
    }
    // Remove the media block
    newCode = newCode.replace(targetMedia.raw, '');
    // Clean up empty double lines
    newCode = newCode.replace(/\n{3,}/g, '\n\n');

    setSourceCode(newCode);
    if (selectedAssetId === assetId) {
      setSelectedAssetId(undefined);
    }
    showToast(`Removed asset '${assetId}' and associated annotations`);
  };

  const handleAddAnnotation = (ann: {
    target: string;
    selector: SpatialSelector | TemporalSelector;
    claim: string;
    label: string;
    confidence: number;
    body?: any;
  }) => {
    const annId = `ann-${ann.label}-${Date.now().toString().slice(-4)}`;
    const lines: string[] = [
      '',
      '```rmd:annotation',
      `id: ${annId}`,
      `target: ${ann.target}`,
      `type: ${ann.selector.type === 'temporal' ? 'temporal-anchor' : 'spatial-region'}`,
      'selector:'
    ];

    if (ann.selector.type === 'temporal') {
      lines.push(`  type: temporal`);
      lines.push(`  start: ${ann.selector.start}`);
      lines.push(`  end: ${ann.selector.end}`);
    } else if (ann.selector.type === 'xywh') {
      lines.push(`  type: xywh`);
      lines.push(`  unit: pixel`);
      lines.push(`  x: ${ann.selector.x}`);
      lines.push(`  y: ${ann.selector.y}`);
      lines.push(`  width: ${ann.selector.width}`);
      lines.push(`  height: ${ann.selector.height}`);
    }

    if (ann.body) {
      lines.push('body:');
      for (const [k, v] of Object.entries(ann.body)) {
        lines.push(`  ${k}: "${String(v).replace(/"/g, '\\"')}"`);
      }
    }

    lines.push(`claim: "${ann.claim.replace(/"/g, '\\"')}"`);
    lines.push(`confidence: ${ann.confidence}`);
    lines.push(`source: human`);
    lines.push('```', '');

    setSourceCode((prev) => prev.trimEnd() + '\n' + lines.join('\n'));
    setSelectedAnnotationId(annId);
    showToast(`Inserted annotation '${annId}' into document`);
  };

  const handleLoadRMDFile = (content: string, filename: string) => {
    setSourceCode(content);
    setSelectedExample({
      id: `imported-${filename}`,
      name: `Imported: ${filename}`,
      kind: 'imported',
      description: `Loaded from ${filename}`,
      content
    });
    setSelectedAssetId(undefined);
    showToast(`Loaded RMD file '${filename}'`);
  };

  const handleDownloadRMD = () => {
    const blob = new Blob([sourceCode], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${doc.frontMatter.id.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'document'}.rmd`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const handleDownloadGraph = () => {
    const graph = toAgentGraph(doc);
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${doc.frontMatter.id.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'document'}.graph.json`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const handleApplyFix = (newSourceCode: string, fixTitle: string) => {
    setSourceCode(newSourceCode);
    showToast(`⚡ Applied Auto-Fix: ${fixTitle}`);
  };

  if (activeAppTab === 'article') {
    return <LandingPage onOpenStudio={() => setActiveAppTab('studio')} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed top-14 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-lg shadow-2xl text-xs font-mono flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1-Click Debugger Modal */}
      <DebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        doc={doc}
        sourceCode={sourceCode}
        onApplyFix={handleApplyFix}
      />

      {/* Universal Import Modal with Multi-Asset Intent */}
      <MediaDropzone
        isOpen={isDropzoneOpen}
        onClose={() => setIsDropzoneOpen(false)}
        hasExistingMedia={hasExistingMedia}
        onAddMedia={handleAddMedia}
        onLoadRMDFile={handleLoadRMDFile}
      />

      {/* Top Navbar */}
      <header className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold font-mono text-sm">
              RMD
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              Rich Media Document
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveAppTab('article')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono text-[11px] font-semibold transition"
            aria-label="Back to Overview Article"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Overview Article</span>
          </button>
        </div>

        {/* Center Mode Switcher (Human View vs Agent View) */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('human')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              viewMode === 'human'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Human Preview
          </button>

          <button
            onClick={() => setViewMode('agent')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              viewMode === 'agent'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Agent Evidence View
          </button>
        </div>

        {/* Right Action Links */}
        <div className="flex items-center gap-2 text-xs">
          {doc.diagnostics.filter((d) => d.level === 'error').length > 0 && (
            <button
              onClick={() => setIsDebugModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 font-mono font-bold transition shadow-sm animate-pulse"
            >
              <Wrench className="w-3.5 h-3.5 text-red-400" />
              <span>1-Click Auto-Fix ({doc.diagnostics.filter((d) => d.level === 'error').length})</span>
            </button>
          )}

          <button
            onClick={() => setIsDropzoneOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 font-mono font-semibold transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            + Import Media
          </button>
        </div>
      </header>

      {/* Main 3-Pane Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Source Editor */}
        <div className="w-[33%] min-w-[320px] h-full flex flex-col">
          <EditorPane
            content={sourceCode}
            onChange={setSourceCode}
            selectedExampleId={selectedExample.id}
            onSelectExample={handleSelectExample}
            diagnostics={doc.diagnostics}
            onOpenDropzone={() => setIsDropzoneOpen(true)}
            onNewDocument={handleNewDocument}
            onDownloadRMD={handleDownloadRMD}
            onDownloadGraph={handleDownloadGraph}
            onOpenDebugger={() => setIsDebugModalOpen(true)}
          />
        </div>

        {/* Center Pane: Rendered Preview (Human or Agent Mode) */}
        <div className="flex-1 h-full overflow-y-auto bg-slate-950 border-r border-slate-800">
          {viewMode === 'human' ? (
            <HumanPreview
              doc={doc}
              selectedAnnotationId={selectedAnnotationId}
              onSelectAnnotation={setSelectedAnnotationId}
              selectedAssetId={selectedAssetId}
              onSelectAsset={setSelectedAssetId}
              onDeleteAsset={handleDeleteAsset}
              onAddAnnotation={handleAddAnnotation}
              onOpenDropzone={() => setIsDropzoneOpen(true)}
            />
          ) : (
            <AgentPreview doc={doc} />
          )}
        </div>

        {/* Right Pane: AST & Graph Inspector */}
        <div className="w-[33%] min-w-[340px] h-full flex flex-col">
          <GraphInspector doc={doc} />
        </div>
      </div>

      {/* Bottom Performance & Metrics Benchmark Bar */}
      <BenchmarkPanel
        doc={doc}
        parseTimeMs={parseTimeMs}
        onOpenDebugger={() => setIsDebugModalOpen(true)}
      />
    </div>
  );
}
export default App;
