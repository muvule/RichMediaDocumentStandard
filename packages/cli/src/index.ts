import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseRMD,
  toAgentGraph,
  RMDQueryEngine,
  canonicalizeJSON,
  formatSelector,
  ASTNode,
  ParseDiagnostic,
  probeBufferMetadata,
  synthesizeRMDDocument
} from '@rmd/core';

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
          }
        }
        if (warnings.length > 0) {
          console.log(`\n⚠️  ${warnings.length} Warning(s) found:`);
          for (const warn of warnings) {
            console.log(`   - [${warn.code}] ${warn.message}`);
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

// 4. Export Command
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
        case 'context':
          outputText = engine.toPromptContext();
          break;
        default:
          console.error(`Unknown format: '${options.format}'. Use 'ast', 'graph', 'json', 'canonical', or 'context'.`);
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

// 5. Ingest Command
program
  .command('ingest <targetPath>')
  .description('Automatically ingest a folder of media files or single media file into a valid RMD document')
  .option('-o, --output <file>', 'Output .rmd file path')
  .option('-t, --title <title>', 'Document title')
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

      if (stat.isDirectory()) {
        const entries = fs.readdirSync(fullPath, { recursive: true }) as string[];
        for (const entry of entries) {
          const entryPath = path.join(fullPath, entry);
          if (fs.statSync(entryPath).isFile()) {
            const ext = path.extname(entryPath).toLowerCase().replace('.', '');
            if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) {
              filePaths.push(entryPath);
            }
          }
        }
      } else {
        filePaths.push(fullPath);
      }

      if (filePaths.length === 0) {
        console.log(`⚠️  No supported media files (images, video, audio) found in '${targetPath}'.`);
        process.exit(0);
      }

      console.log(`📦 Discovered ${filePaths.length} media file(s). Probing metadata...`);

      const discoveredAssets = filePaths.map((fp) => {
        const buffer = fs.readFileSync(fp);
        const rel = path.relative(process.cwd(), fp).replace(/\\/g, '/');
        const asset = probeBufferMetadata(
          new Uint8Array(buffer),
          path.basename(fp),
          fp,
          rel
        );
        console.log(`   - [${asset.kind.toUpperCase()}] ${asset.fileName} (${(asset.byteSize / 1024).toFixed(1)} KB${asset.width ? `, ${asset.width}x${asset.height}` : ''}${asset.duration ? `, ${asset.duration}s` : ''})`);
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
