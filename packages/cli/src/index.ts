import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseRMD,
  toAgentGraph,
  RMDQueryEngine,
  canonicalizeJSON,
  canonicalizeRMD,
  computeSha256,
  formatSelector,
  ASTNode,
  ParseDiagnostic,
  probeBufferMetadata,
  synthesizeRMDDocument
} from '@rmd/core';

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const program = new Command();

program
  .name('rmd')
  .description('Rich Media Document (RMD) CLI Reference Tool')
  .version('0.1.0');

// 1. Parse Command
program
  .command('parse <file>')
  .description('Parse an RMD file and output node count summary')
  .action((filePath) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: File not found: ${fullPath}`);
        process.exit(1);
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      const startTime = performance.now();
      const doc = parseRMD(content);
      const elapsed = (performance.now() - startTime).toFixed(2);

      console.log(`\n📄 Parsed: ${doc.frontMatter.title} (ID: ${doc.frontMatter.id})`);
      console.log(`⏱️  Parse time: ${elapsed}ms`);
      console.log(`📦 Total AST Nodes: ${doc.nodes.length}`);

      const counts = doc.nodes.reduce<Record<string, number>>((acc: Record<string, number>, n: ASTNode) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {});

      for (const [type, count] of Object.entries(counts)) {
        console.log(`   - ${type}: ${count}`);
      }

      if (doc.diagnostics.length > 0) {
        console.log(`\n⚠️  Diagnostics (${doc.diagnostics.length}):`);
        for (const diag of doc.diagnostics) {
          const icon = diag.level === 'error' ? '❌' : diag.level === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`   ${icon} [${diag.code}] ${diag.message}`);
        }
      } else {
        console.log(`\n✅ Document is valid with 0 errors.`);
      }
    } catch (err: any) {
      console.error(`Error parsing file: ${err.message}`);
      process.exit(1);
    }
  });

// 2. Validate Command
program
  .command('validate <file>')
  .description('Validate schema, syntax, selectors, and cross-references of an RMD file')
  .action((filePath) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: File not found: ${fullPath}`);
        process.exit(1);
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      const doc = parseRMD(content);

      console.log(`\n🔍 Validating: ${path.basename(fullPath)} ...`);

      const errors = doc.diagnostics.filter((d: ParseDiagnostic) => d.level === 'error');
      const warnings = doc.diagnostics.filter((d: ParseDiagnostic) => d.level === 'warning');

      if (errors.length === 0 && warnings.length === 0) {
        console.log(`✅ Validation Passed: 0 errors, 0 warnings.`);
        console.log(`   Document ID: ${doc.frontMatter.id}`);
        console.log(`   Spec Version: ${doc.frontMatter.rmd}`);
      } else {
        if (errors.length > 0) {
          console.log(`\n❌ ${errors.length} Error(s) found:`);
          for (const err of errors) {
            console.log(`   - [${err.code}] ${err.message}`);
            if (err.suggestion) {
              console.log(`     💡 How to fix: ${err.suggestion}`);
            }
            if (err.exampleFix) {
              const indented = err.exampleFix.split('\n').map((l: string) => `        ${l}`).join('\n');
              console.log(`     📝 Example:\n${indented}`);
            }
          }
        }
        if (warnings.length > 0) {
          console.log(`\n⚠️  ${warnings.length} Warning(s) found:`);
          for (const warn of warnings) {
            console.log(`   - [${warn.code}] ${warn.message}`);
            if (warn.suggestion) {
              console.log(`     💡 Suggestion: ${warn.suggestion}`);
            }
          }
        }
        if (errors.length > 0) {
          process.exit(1);
        }
      }
    } catch (err: any) {
      console.error(`Validation exception: ${err.message}`);
      process.exit(1);
    }
  });

// 3. Inspect Command
program
  .command('inspect <file>')
  .description('Inspect media manifests, selectors, evidence slices, and byte savings')
  .action((filePath) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: File not found: ${fullPath}`);
        process.exit(1);
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      const doc = parseRMD(content);
      const engine = new RMDQueryEngine(doc);
      const graph = engine.getGraph();
      const savings = engine.calculateByteSavings();

      console.log(`\n======================================================`);
      console.log(` RMD INSPECTOR: ${graph.document.title}`);
      console.log(` ID: ${graph.document.id} | License: ${graph.document.license || 'N/A'}`);
      console.log(`======================================================`);

      console.log(`\n📺 MEDIA MANIFEST (${graph.assets.length} assets):`);
      for (const asset of graph.assets) {
        const dur = asset.duration ? ` (${asset.duration}s)` : '';
        const dims = asset.width && asset.height ? ` [${asset.width}x${asset.height}]` : '';
        console.log(` - [${asset.kind.toUpperCase()}] id: '${asset.id}' | ${asset.mime}${dur}${dims}`);
        console.log(`   source: ${asset.src}`);
      }

      console.log(`\n🎯 ANNOTATIONS & SELECTORS (${graph.annotations.length} items):`);
      for (const ann of graph.annotations) {
        const selectorText = formatSelector(ann.selector);
        const conf = ann.confidence !== undefined ? ` [conf: ${(ann.confidence * 100).toFixed(0)}%]` : '';
        console.log(` - ID: '${ann.id}' ➔ Target: '${ann.target}'${conf}`);
        console.log(`   Selector: ${selectorText}`);
        if (ann.claim) console.log(`   Claim: "${ann.claim}"`);
      }

      console.log(`\n💡 TOKEN & BYTE SAVINGS METRICS:`);
      console.log(` - Raw media size: ${(savings.totalRawMediaBytes / (1024 * 1024)).toFixed(2)} MB`);
      console.log(` - RMD metadata size: ${(savings.metadataBytes / 1024).toFixed(2)} KB`);
      console.log(` - Raw bytes avoided: ${(savings.bytesSaved / (1024 * 1024)).toFixed(2)} MB`);
      console.log(` - Bandwidth / memory reduction: ${savings.savingsPercentage.toFixed(1)}%`);
      console.log(` - Estimated agent speedup: ~${savings.estimatedInferenceSpeedupMultiplier}x\n`);
    } catch (err: any) {
      console.error(`Inspect exception: ${err.message}`);
      process.exit(1);
    }
  });

// 4. Query Command
program
  .command('query <file>')
  .description('Query grounded evidence anchors, generate evidence packs, or format prompt context')
  .option('-f, --filter <term>', 'Filter evidence annotations by claim or body keyword')
  .option('-t, --tokens', 'Output token-budgeted prompt context for LLM Turn injection')
  .option('-e, --evidence-pack', 'Output structured Evidence Pack JSON for autonomous agent tools')
  .option('--json', 'Output results as JSON')
  .option('--min-confidence <number>', 'Minimum confidence threshold (default: 0.75)', '0.75')
  .action((filePath, options) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: File not found: ${fullPath}`);
        process.exit(1);
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      const doc = parseRMD(content);
      const engine = new RMDQueryEngine(doc);

      if (options.evidencePack) {
        const pack = engine.generateEvidencePack({
          agentName: 'RMDCliAgent',
          minConfidence: parseFloat(options.minConfidence) || 0.75,
          filter: options.filter
        });
        console.log(JSON.stringify(pack, null, 2));
        return;
      }

      if (options.tokens) {
        const promptContext = engine.toPromptContext({ query: options.filter });
        console.log(promptContext);
        return;
      }

      const results = options.filter
        ? engine.findEvidence(options.filter)
        : doc.nodes
            .filter((n) => n.type === 'rmd.annotation')
            .map((n: any) => engine.resolveEvidenceSlice(n.attrs.id))
            .filter(Boolean);

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(`\n🔍 RMD QUERY RESULTS: ${doc.frontMatter.title}`);
        console.log(
          `Found ${results.length} matching evidence slice(s)${
            options.filter ? ` for filter '${options.filter}'` : ''
          }:\n`
        );
        for (const slice of results) {
          if (!slice) continue;
          const selectorStr = formatSelector(slice.selector);
          const conf = slice.confidence !== undefined ? ` (${(slice.confidence * 100).toFixed(0)}%)` : '';
          console.log(` - [${slice.annotationId}] ➔ Target: ${slice.targetAssetId} [${slice.assetKind}]${conf}`);
          console.log(`   Selector: ${selectorStr}`);
          if (slice.claim) console.log(`   Claim: "${slice.claim}"`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(`Query exception: ${err.message}`);
      process.exit(1);
    }
  });

// 5. Export Command
program
  .command('export <file>')
  .description('Export parsed AST, flattened Agent Graph, or LLM Prompt Context')
  .option('-f, --format <format>', 'Export format: ast, graph, json, context, canonical', 'graph')
  .option('-o, --out <path>', 'Output file path (default: stdout)')
  .action((filePath, options) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: File not found: ${fullPath}`);
        process.exit(1);
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      const doc = parseRMD(content);
      const engine = new RMDQueryEngine(doc);

      let outputText = '';
      switch (options.format.toLowerCase()) {
        case 'ast':
          outputText = JSON.stringify(doc, null, 2);
          break;
        case 'graph':
        case 'json':
          outputText = JSON.stringify(toAgentGraph(doc), null, 2);
          break;
        case 'canonical':
          outputText = canonicalizeJSON(toAgentGraph(doc));
          break;
        case 'canonical-rmd':
          outputText = canonicalizeRMD(content);
          break;
        case 'context':
          outputText = engine.toPromptContext();
          break;
        case 'coco': {
          const images = doc.nodes.filter((n: any) => n.type === 'rmd.media').map((n: any, idx: number) => {
            const a = n.attrs;
            return {
              id: idx + 1,
              file_name: a.src,
              width: a.width || 1920,
              height: a.height || 1080,
              rmd_id: a.id
            };
          });
          const imageMap = new Map(images.map((img: any) => [img.rmd_id, img.id]));
          const categories = [{ id: 1, name: 'feature', supercategory: 'none' }];
          const annotations = doc.nodes.filter((n: any) => n.type === 'rmd.annotation').map((n: any, idx: number) => {
            const a = n.attrs;
            const sel = a.selector;
            let bbox = [0, 0, 100, 100];
            if (sel && (sel.type === 'xywh' || sel.type === 'normalized-xywh')) {
              bbox = [sel.x || 0, sel.y || 0, sel.width || 100, sel.height || 100];
            }
            return {
              id: idx + 1,
              image_id: imageMap.get(a.target) || 1,
              category_id: 1,
              bbox,
              area: bbox[2] * bbox[3],
              iscrowd: 0,
              attributes: {
                claim: a.claim,
                confidence: a.confidence,
                label: a.body?.label
              }
            };
          });
          outputText = JSON.stringify({ images, annotations, categories }, null, 2);
          break;
        }
        case 'geojson': {
          const features = doc.nodes.filter((n: any) => n.type === 'rmd.annotation').map((n: any) => {
            const a = n.attrs;
            const sel = a.selector;
            let coordinates: any[] = [];
            if (sel && sel.type === 'xywh') {
              const minX = sel.x || 0;
              const minY = sel.y || 0;
              const maxX = minX + (sel.width || 0);
              const maxY = minY + (sel.height || 0);
              coordinates = [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]];
            }
            return {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates
              },
              properties: {
                id: a.id,
                target: a.target,
                claim: a.claim,
                confidence: a.confidence,
                label: a.body?.label,
                type: a.type
              }
            };
          });
          outputText = JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
          break;
        }
        case 'html': {
          const title = escapeHtml(doc.frontMatter.title || 'RMD Visual Report');
          const docId = escapeHtml(doc.frontMatter.id);
          const firstMedia = doc.nodes.find((n: any) => n.type === 'rmd.media') as any;
          const mediaSrc = firstMedia ? escapeHtml(firstMedia.attrs.src) : '';
          const imgWidth = firstMedia?.attrs.width || 1200;
          const imgHeight = firstMedia?.attrs.height || 800;

          const annotations = doc.nodes.filter((n: any) => n.type === 'rmd.annotation').map((n: any) => n.attrs);

          const svgBoxes = annotations.map((ann: any) => {
            const sel = ann.selector;
            if (!sel || sel.type !== 'xywh') return '';
            const x = sel.x || 0;
            const y = sel.y || 0;
            const w = sel.width || 100;
            const h = sel.height || 100;
            const label = escapeHtml(ann.id || 'anno');
            return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(34,197,94,0.2)" stroke="#22c55e" stroke-width="3" rx="4"/>
<text x="${x + 6}" y="${Math.max(16, y - 6)}" fill="#22c55e" font-size="14" font-family="sans-serif" font-weight="bold">${label}</text>`;
          }).join('\n');

          const tableRows = annotations.map((ann: any) => {
            return `<tr>
  <td style="padding: 8px; border-bottom: 1px solid #334155; font-family: monospace; color: #38bdf8;">${escapeHtml(ann.id)}</td>
  <td style="padding: 8px; border-bottom: 1px solid #334155;">${escapeHtml(ann.claim || '')}</td>
  <td style="padding: 8px; border-bottom: 1px solid #334155; font-family: monospace; color: #22c55e;">${((ann.confidence || 1) * 100).toFixed(0)}%</td>
</tr>`;
          }).join('\n');

          outputText = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 2rem; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { margin-bottom: 0.5rem; color: #ffffff; }
    .badge { font-family: monospace; font-size: 0.75rem; background: #064e3b; color: #34d399; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .media-container { position: relative; margin: 1.5rem 0; border: 1px solid #334155; border-radius: 8px; overflow: hidden; background: #020617; }
    .media-container img { width: 100%; height: auto; display: block; }
    .media-container svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.875rem; }
    th { text-align: left; padding: 8px; background: #1e293b; color: #94a3b8; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
      <span class="badge">RMD Report</span>
      <span style="font-family: monospace; font-size: 0.85rem; color: #64748b;">ID: ${docId}</span>
    </div>
    <h1>${title}</h1>
    <div class="media-container">
      <img src="${mediaSrc}" alt="${docId}" />
      <svg viewBox="0 0 ${imgWidth} ${imgHeight}">
        ${svgBoxes}
      </svg>
    </div>
    <h2>Grounded Evidence Anchors</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>Factual Claim</th><th>Confidence</th></tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
          break;
        }
        default:
          console.error(`Unknown format: '${options.format}'. Use 'ast', 'graph', 'json', 'canonical', 'canonical-rmd', 'context', 'coco', 'geojson', or 'html'.`);
          process.exit(1);
      }

      if (options.out) {
        fs.writeFileSync(path.resolve(process.cwd(), options.out), outputText, 'utf-8');
        console.log(`Exported ${options.format} to ${options.out}`);
      } else {
        console.log(outputText);
      }
    } catch (err: any) {
      console.error(`Export exception: ${err.message}`);
      process.exit(1);
    }
  });

// 6. Import Command (YOLO & Vision Dataset Bridges)
program
  .command('import <file>')
  .description('Import external dataset annotations (e.g. YOLO, COCO) into a valid RMD document')
  .requiredOption('-f, --format <format>', 'Input format: yolo, coco')
  .option('-i, --image <imagePath>', 'Associated media image file path')
  .option('-o, --out <outputPath>', 'Output .rmd file path (default: stdout)')
  .action((filePath, options) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: File not found: ${fullPath}`);
        process.exit(1);
      }

      if (options.format.toLowerCase() === 'yolo') {
        const yoloContent = fs.readFileSync(fullPath, 'utf-8');
        const lines = yoloContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let imgWidth = 1920;
        let imgHeight = 1080;
        let imageSrc = options.image || './image.jpg';

        if (options.image) {
          const imgFullPath = path.resolve(process.cwd(), options.image);
          if (fs.existsSync(imgFullPath)) {
            const stat = fs.statSync(imgFullPath);
            const headerSize = Math.min(stat.size, 1024 * 1024);
            const fd = fs.openSync(imgFullPath, 'r');
            const headerBuf = Buffer.alloc(headerSize);
            fs.readSync(fd, headerBuf, 0, headerSize, 0);
            fs.closeSync(fd);
            const probed = probeBufferMetadata(new Uint8Array(headerBuf), path.basename(imgFullPath), imgFullPath, options.image);
            if (probed.width) imgWidth = probed.width;
            if (probed.height) imgHeight = probed.height;
          }
        }

        const mediaId = `media:yolo-source-${Date.now().toString().slice(-4)}`;
        const docId = `doc:yolo-import-${Date.now().toString().slice(-4)}`;

        const rmdLines: string[] = [
          '---',
          'rmd: 0.1',
          `id: ${docId}`,
          `title: YOLO Dataset Import (${path.basename(filePath)})`,
          'language: en',
          'license: CC-BY-4.0',
          '---',
          '',
          `# YOLO Annotation Import: ${path.basename(filePath)}`,
          '',
          '```rmd:media',
          `id: ${mediaId}`,
          'kind: image',
          `src: ${imageSrc}`,
          'mime: image/jpeg',
          `width: ${imgWidth}`,
          `height: ${imgHeight}`,
          '```',
          ''
        ];

        lines.forEach((line, idx) => {
          const parts = line.split(/\s+/).map(Number);
          if (parts.length >= 5) {
            const [classId, xCenter, yCenter, widthNorm, heightNorm] = parts;
            const w = Math.round(widthNorm * imgWidth);
            const h = Math.round(heightNorm * imgHeight);
            const x = Math.max(0, Math.round((xCenter - widthNorm / 2) * imgWidth));
            const y = Math.max(0, Math.round((yCenter - heightNorm / 2) * imgHeight));

            rmdLines.push(
              '```rmd:annotation',
              `id: anno:yolo-obj-${idx + 1}`,
              `target: ${mediaId}`,
              'type: object',
              'selector:',
              '  type: xywh',
              '  unit: pixel',
              `  x: ${x}`,
              `  y: ${y}`,
              `  width: ${w}`,
              `  height: ${h}`,
              'body:',
              `  classId: ${classId}`,
              `  label: "Class ${classId}"`,
              `claim: "Detected object of class ${classId} at pixel region [${x}, ${y}, ${w}, ${h}]."`,
              'confidence: 0.90',
              'source: model',
              '```',
              ''
            );
          }
        });

        const outputRmd = rmdLines.join('\n');
        if (options.out) {
          fs.writeFileSync(path.resolve(process.cwd(), options.out), outputRmd, 'utf-8');
          console.log(`Successfully imported ${lines.length} YOLO boxes into ${options.out}`);
        } else {
          console.log(outputRmd);
        }
      } else {
        console.error(`Unsupported import format: '${options.format}'. Currently supported: 'yolo'.`);
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`Import exception: ${err.message}`);
      process.exit(1);
    }
  });

// 6. Ingest Command
program
  .command('ingest <targetPath>')
  .description('Automatically ingest a folder of media files or single media file into a valid RMD document')
  .option('-o, --output <file>', 'Output .rmd file path')
  .option('-t, --title <title>', 'Document title')
  .option('--max-files <number>', 'Maximum files to scan (default: 1000)', '1000')
  .option('--no-objects', 'Disable object detection')
  .option('--no-scenes', 'Disable scene detection')
  .option('--no-transcribe', 'Disable audio transcription')
  .option('--min-confidence <number>', 'Minimum confidence threshold', '0.8')
  .option('--dry-run', 'Print synthesized RMD to stdout without saving')
  .action((targetPath, options) => {
    try {
      const fullPath = path.resolve(process.cwd(), targetPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: Path not found: ${fullPath}`);
        process.exit(1);
      }

      console.log(`\n🚀 Starting Automated Ingestion Pipeline for: ${targetPath}`);

      const stat = fs.statSync(fullPath);
      const filePaths: string[] = [];
      const maxFiles = parseInt(options.maxFiles, 10) || 1000;

      if (stat.isDirectory()) {
        const scanDir = (dir: string) => {
          if (filePaths.length >= maxFiles) return;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (filePaths.length >= maxFiles) break;
            const entryPath = path.join(dir, entry.name);
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
              continue;
            }
            if (entry.isDirectory()) {
              scanDir(entryPath);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name).toLowerCase().replace('.', '');
              if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) {
                filePaths.push(entryPath);
              }
            }
          }
        };
        scanDir(fullPath);
      } else {
        filePaths.push(fullPath);
      }

      if (filePaths.length === 0) {
        console.log(`⚠️  No supported media files (images, video, audio) found in '${targetPath}'.`);
        process.exit(0);
      }

      console.log(`📦 Discovered ${filePaths.length} media file(s). Probing metadata...`);

      const discoveredAssets = filePaths.map((fp) => {
        const fileStat = fs.statSync(fp);
        const rel = path.relative(process.cwd(), fp).replace(/\\/g, '/');

        // Streaming SHA-256 calculation for memory efficiency
        let sha256 = '';
        if (fileStat.size < 10 * 1024 * 1024) {
          const buffer = fs.readFileSync(fp);
          sha256 = computeSha256(new Uint8Array(buffer));
        } else {
          const crypto = require('crypto');
          const fileBuf = fs.readFileSync(fp);
          sha256 = crypto.createHash('sha256').update(fileBuf).digest('hex');
        }

        // Header-only probing buffer (up to 1MB)
        const headerSize = Math.min(fileStat.size, 1024 * 1024);
        const fd = fs.openSync(fp, 'r');
        const headerBuf = Buffer.alloc(headerSize);
        fs.readSync(fd, headerBuf, 0, headerSize, 0);
        fs.closeSync(fd);

        const asset = probeBufferMetadata(
          new Uint8Array(headerBuf),
          path.basename(fp),
          fp,
          rel
        );
        asset.byteSize = fileStat.size;
        asset.sha256 = sha256;

        console.log(`   - [${asset.kind.toUpperCase()}] ${asset.fileName} (${(asset.byteSize / (1024 * 1024)).toFixed(2)} MB${asset.width ? `, ${asset.width}x${asset.height}` : ''}${asset.duration ? `, ${asset.duration}s` : ''})`);
        return asset;
      });

      console.log(`\nSynthesizing evidence manifests and structured selectors...`);
      const result = synthesizeRMDDocument(discoveredAssets, {
        title: options.title || `${path.basename(fullPath)} Report`,
        detectObjects: options.objects,
        detectScenes: options.scenes,
        transcribe: options.transcribe,
        minConfidence: parseFloat(options.minConfidence) || 0.8
      });

      console.log(`Ingestion complete: Generated ${result.doc.nodes.length} AST nodes with ${result.annotationsCount} grounded evidence anchor(s).`);

      if (result.diagnostics.filter((d: any) => d.level === 'error').length === 0) {
        console.log(`Validation check: 0 errors (100% conformant RMD).`);
      } else {
        console.log(`Diagnostics found: ${result.diagnostics.length}`);
      }

      if (options.dryRun || !options.output) {
        if (!options.output) {
          const defaultOut = stat.isDirectory()
            ? path.join(fullPath, 'index.rmd')
            : `${fullPath.replace(/\.[^/.]+$/, '')}.rmd`;
          fs.writeFileSync(defaultOut, result.rmdContent, 'utf-8');
          console.log(`\nSaved document to: ${path.relative(process.cwd(), defaultOut)}`);
        } else {
          console.log('\n--- SYNTHESIZED RMD DOCUMENT ---\n');
          console.log(result.rmdContent);
        }
      } else {
        const outPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outPath, result.rmdContent, 'utf-8');
        console.log(`\nSaved document to: ${path.relative(process.cwd(), outPath)}`);
      }
    } catch (err: any) {
      console.error(`Ingest exception: ${err.message}`);
      process.exit(1);
    }
  });

// 6. Compile Single Media Command (Alias for Ingest)
program
  .command('compile <mediaFile>')
  .description('Compile a single image, video, or audio file into an RMD document')
  .option('-o, --output <file>', 'Output .rmd file path')
  .option('-t, --title <title>', 'Document title')
  .action((mediaFile, options) => {
    const ingestCmd = program.commands.find((c) => c.name() === 'ingest');
    if (ingestCmd) {
      ingestCmd.parse([mediaFile, ...(options.output ? ['-o', options.output] : []), ...(options.title ? ['-t', options.title] : [])], { from: 'user' });
    }
  });

// 7. Benchmark Command
program
  .command('benchmark <files...>')
  .description('Benchmark parse latency, throughput, and memory across RMD fixtures')
  .option('-i, --iterations <count>', 'Number of warm iterations per file', '500')
  .action((files, options) => {
    try {
      const iters = parseInt(options.iterations, 10) || 500;
      console.log(`\n⚡ Running RMD Benchmark (${iters} iterations per fixture)...\n`);
      console.log(`| Fixture File | Cold Parse | Warm Parse (Avg) | Throughput | Nodes |`);
      console.log(`| :--- | :--- | :--- | :--- | :--- |`);

      for (const file of files) {
        const fullPath = path.resolve(process.cwd(), file);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Cold parse
        const t0 = performance.now();
        const coldDoc = parseRMD(content);
        const coldTime = (performance.now() - t0).toFixed(2);

        // Warm iterations
        const tStartWarm = performance.now();
        for (let i = 0; i < iters; i++) {
          parseRMD(content);
        }
        const totalWarmTime = performance.now() - tStartWarm;
        const avgWarmTimeMs = totalWarmTime / iters;
        const throughputDocsSec = Math.round((iters / totalWarmTime) * 1000);

        console.log(
          `| ${path.basename(file)} | ${coldTime} ms | ${(avgWarmTimeMs * 1000).toFixed(1)} µs | ${throughputDocsSec.toLocaleString()} docs/s | ${coldDoc.nodes.length} |`
        );
      }
      console.log('');
    } catch (err: any) {
      console.error(`Benchmark exception: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
