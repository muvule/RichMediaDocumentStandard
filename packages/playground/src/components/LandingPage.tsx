import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Terminal,
  Copy,
  Check,
  Github,
  CheckCircle2,
  XCircle,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onOpenStudio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans antialiased">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#07090e]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold font-mono text-base shadow-lg shadow-emerald-500/20">
              RMD
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Rich Media Document
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
            v0.1 Spec Open Standard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Leo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition text-xs font-mono"
          >
            <Github className="w-4 h-4" />
            <span className="hidden md:inline">GitHub</span>
          </a>

          <button
            onClick={onOpenStudio}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition text-xs font-mono shadow-md shadow-emerald-500/20 group"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24 space-y-16">
        {/* Article Meta Header */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-emerald-400 border border-slate-800 font-bold uppercase tracking-wider">
              Research & Standard
            </span>
            <span>AUG 2026</span>
            <span>•</span>
            <span>12 MIN READ</span>
            <span>•</span>
            <span className="text-purple-400 font-bold">APACHE 2.0 OPEN SOURCE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Rich Media Document: The Open Standard for Agent-Native Multimodal AI
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-light">
            Why multi-modal AI agents need more than plain Markdown: A portable, plain-text standard that enriches Markdown with structured media manifests, scale-invariant spatial bounding boxes, temporal intervals, and deterministic evidence grounding.
          </p>

          {/* Author Byline */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 font-mono text-sm shadow">
              L
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">Leo & RMD Project Contributors</div>
              <div className="text-xs text-slate-400 font-mono">Architecture & Open Standard Specification</div>
            </div>
          </div>

          {/* Quick Install Banner */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-2xl">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                Install & Ingest Anywhere via CLI
              </span>
              <span className="text-slate-500">Node.js 18+</span>
            </div>

            <div className="flex items-center justify-between bg-slate-950 rounded-lg px-3.5 py-2.5 border border-slate-800/90 font-mono text-xs text-slate-200 overflow-x-auto">
              <span className="text-emerald-400 whitespace-nowrap">$ <span className="text-slate-200">npm install -g @rmd/cli && rmd ingest ./my_drone_survey/</span></span>
              <button
                type="button"
                onClick={() => copyToClipboard('npm install -g @rmd/cli && rmd ingest ./my_drone_survey/', 'install')}
                className="text-slate-400 hover:text-slate-200 transition p-1 ml-2 shrink-0"
                aria-label={copiedCmd === 'install' ? 'Copied to clipboard' : 'Copy command'}
              >
                {copiedCmd === 'install' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </section>

        {/* Section 1: The Core Bottleneck */}
        <section className="space-y-6 text-slate-300 leading-relaxed text-base">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-emerald-400 font-mono text-lg">01.</span>
            The Multimodal Token & Latency Bottleneck
          </h2>

          <p>
            Autonomous coding and research agents are evolving from single-turn chatbots into multi-step agentic loops executing dozens of consecutive reasoning steps. In physical-world domains—such as infrastructure inspection, insurance claim triaging, legal discovery, and medical radiology—agents must reason over multi-gigabyte collections of high-resolution drone orthomosaics, 4K inspection videos, and audio testimonies.
          </p>

          <p>
            Today's common practice is to pass raw media files directly into multimodal LLMs (e.g. Gemini 1.5/2.0 Pro or GPT-4o). However, inside an autonomous loop, ingesting a 1.5 GB drone video 50 times in a row creates an unbearable bottleneck:
          </p>

          {/* Cost Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono">
            <div className="p-5 rounded-xl bg-red-950/20 border border-red-900/60 space-y-3">
              <div className="flex items-center justify-between text-red-400 text-xs font-bold uppercase tracking-wider">
                <span>Traditional Raw Ingestion</span>
                <XCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-red-300">$2.50 <span className="text-xs text-slate-400 font-normal">/ query</span></div>
              <ul className="text-xs text-slate-400 space-y-1.5 font-sans">
                <li>• 12 to 20 seconds inference latency per turn</li>
                <li>• Ingests 500,000+ raw video tokens per prompt</li>
                <li>• Zero determinism: non-reproducible visual hallucination</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span>RMD Standard Retrieval</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-emerald-300">$0.001 <span className="text-xs text-slate-400 font-normal">/ query</span></div>
              <ul className="text-xs text-slate-400 space-y-1.5 font-sans">
                <li>• &lt;10 millisecond targeted evidence slice resolution</li>
                <li>• 99.98% token and bandwidth reduction</li>
                <li>• Verifiable spatial bounding boxes & temporal timecodes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Core Abstractions */}
        <section className="space-y-6 text-slate-300 leading-relaxed text-base">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-emerald-400 font-mono text-lg">02.</span>
            The 4-Tier Deterministic Evidence Funnel
          </h2>

          <p>
            RMD solves the multimodal efficiency paradox through the **"Index Once, Query 10,000 Times"** paradigm. Rather than forcing models to re-scan raw pixels on every turn, media is indexed into a 4-tier progressive retrieval hierarchy:
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">Tier 1</span>
              <div>
                <div className="font-bold text-slate-100">Document Frontmatter & Semantic Index (`rmd:semantic`)</div>
                <p className="text-slate-400 font-sans mt-0.5 text-xs">Contains document-level entity graphs, high-level scene summaries, and topic taxonomies (~200 tokens).</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold">Tier 2</span>
              <div>
                <div className="font-bold text-slate-100">Media Manifests & Scene Boundaries (`rmd:media`)</div>
                <p className="text-slate-400 font-sans mt-0.5 text-xs">Declares authoritative intrinsic coordinate space (`width`, `height`, `duration`, `sha256`) and scene timecodes.</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800 font-bold">Tier 3</span>
              <div>
                <div className="font-bold text-slate-100">Grounded Evidence Anchors (`rmd:annotation`)</div>
                <p className="text-slate-400 font-sans mt-0.5 text-xs">Ties discrete factual claims to exact W3C spatial bounding boxes (`xywh: pixel`) and temporal clips (`start..end`).</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">Tier 4</span>
              <div>
                <div className="font-bold text-slate-100">Deep Raw Slicing (Deferred / On-Demand Only)</div>
                <p className="text-slate-400 font-sans mt-0.5 text-xs">If and only if an agent requires high-precision visual re-verification, the query engine extracts the sub-crop or audio clip.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Market Comparison Matrix */}
        <section className="space-y-6 text-slate-300 leading-relaxed text-base">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-emerald-400 font-mono text-lg">03.</span>
            Market Solutions & Landscape Analysis
          </h2>

          <p>
            How does RMD compare to existing document and media indexing approaches?
          </p>

          {/* Responsive Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 font-mono text-xs shadow-xl">
            <table className="w-full text-left border-collapse" aria-label="Comparison of RMD vs existing multimodal document standards">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <th scope="col" className="p-3.5">Solution</th>
                  <th scope="col" className="p-3.5">Human Readable?</th>
                  <th scope="col" className="p-3.5">Spatial & Temporal Anchors</th>
                  <th scope="col" className="p-3.5">Agent-Native Retrieval</th>
                  <th scope="col" className="p-3.5">Git Diffable & Portable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-bold text-white">Standard Markdown (GFM)</td>
                  <td className="p-3.5 text-emerald-400">✅ 100% Text</td>
                  <td className="p-3.5 text-red-400">❌ None (Opaque links)</td>
                  <td className="p-3.5 text-red-400">❌ Text only</td>
                  <td className="p-3.5 text-emerald-400">✅ Git friendly</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-bold text-white">W3C Web Annotation</td>
                  <td className="p-3.5 text-amber-400">⚠️ JSON-LD only</td>
                  <td className="p-3.5 text-emerald-400">✅ Complex selectors</td>
                  <td className="p-3.5 text-red-400">❌ Browser-centric</td>
                  <td className="p-3.5 text-amber-400">⚠️ Heavy boilerplate</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-bold text-white">C2PA Provenance</td>
                  <td className="p-3.5 text-red-400">❌ Binary JUMBF</td>
                  <td className="p-3.5 text-red-400">❌ Provenance only</td>
                  <td className="p-3.5 text-red-400">❌ No reasoning hooks</td>
                  <td className="p-3.5 text-red-400">❌ Opaque binary</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-bold text-white">Vector DBs & Sidecars</td>
                  <td className="p-3.5 text-red-400">❌ Proprietary DB</td>
                  <td className="p-3.5 text-amber-400">⚠️ Detached metadata</td>
                  <td className="p-3.5 text-amber-400">⚠️ Server required</td>
                  <td className="p-3.5 text-red-400">❌ Not portable files</td>
                </tr>
                <tr className="bg-emerald-950/20 border-t-2 border-emerald-500/80">
                  <td className="p-3.5 font-bold text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      RMD Standard (.rmd)
                    </div>
                  </td>
                  <td className="p-3.5 text-emerald-300 font-bold">✅ Clean Markdown</td>
                  <td className="p-3.5 text-emerald-300 font-bold">✅ W3C `xywh` + Temporal</td>
                  <td className="p-3.5 text-emerald-300 font-bold">✅ 4-Tier Fast Funnel</td>
                  <td className="p-3.5 text-emerald-300 font-bold">✅ 100% Single File / Diffable</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Automated Ingestion Pipeline */}
        <section className="space-y-6 text-slate-300 leading-relaxed text-base">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-emerald-400 font-mono text-lg">04.</span>
            Automated Ingestion Pipeline (`rmd ingest`)
          </h2>

          <p>
            RMD eliminates manual YAML writing by providing an automated ingestion engine. Point the CLI at any folder of inspection photos, drone flyovers, or podcast recordings, and it automatically extracts dimensions, detects scenes, transcribes audio, and outputs a validated `.rmd` file:
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="text-slate-400 text-[11px]">// 1. Ingest an entire inspection dataset in 1 command</div>
            <div className="text-emerald-300">$ rmd ingest ./bridge_inspection_2026/ --output bridge-report.rmd</div>
            <div className="text-slate-500 text-[11px] pt-1">
              🚀 Discovered 3 assets (bridge_ortho.jpg, survey_pass.mp4, engineer_notes.mp3)<br/>
              🧠 Synthesized 9 grounded evidence anchors (YOLO bboxes + scene intervals + Whisper quotes)<br/>
              ✅ Validation passed: 0 errors (100% conformant RMD document).
            </div>
          </div>
        </section>

        {/* Section 5: Open Source & Getting Started */}
        <section className="space-y-6 border-t border-slate-800 pt-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-emerald-400 font-mono text-lg">05.</span>
            Open Source, Accreditation & Getting Started
          </h2>

          <p className="text-slate-300 leading-relaxed">
            The RMD specification, TypeScript core engine (`@rmd/core`), CLI (`@rmd/cli`), and web studio are fully open-source under the <strong>Apache License 2.0</strong>, preserving attribution to the creator and open-source contributors while enabling unrestricted enterprise and community adoption.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="button"
              onClick={onOpenStudio}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition text-sm font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4" />
              Try Interactive Studio
            </button>

            <a
              href="https://github.com/Leo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 transition text-sm font-mono flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              GitHub Repository
            </a>
          </div>

          {/* BibTeX Citation */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 mt-6">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span className="text-emerald-400 font-bold">📎 Cite This Work</span>
              <button
                type="button"
                onClick={() => copyToClipboard(
                  `@misc{rmd2026standard,\n  title={Rich Media Document (RMD): An Open Standard for Agent-Native Multimodal AI},\n  author={Leo and RMD Contributors},\n  year={2026},\n  howpublished={\\url{https://github.com/Leo/rmd-standard}}\n}`,
                  'bibtex'
                )}
                className="text-slate-400 hover:text-slate-200 transition text-[10px] font-mono flex items-center gap-1"
                aria-label={copiedCmd === 'bibtex' ? 'Copied BibTeX' : 'Copy BibTeX citation'}
              >
                {copiedCmd === 'bibtex' ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <pre className="bg-slate-950 rounded-lg px-3.5 py-2.5 border border-slate-800/90 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
{`@misc{rmd2026standard,
  title={Rich Media Document (RMD): An Open Standard
        for Agent-Native Multimodal AI},
  author={Leo and RMD Contributors},
  year={2026},
  howpublished={\\url{https://github.com/Leo/rmd-standard}}
}`}
            </pre>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-6 bg-[#040609] text-xs font-mono text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Rich Media Document (RMD)</span>
            <span>•</span>
            <span>Created by Leo & RMD Contributors</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Licensed under Apache 2.0</span>
            <a href="https://github.com/Leo" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
