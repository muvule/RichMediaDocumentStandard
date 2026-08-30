# Agent SDK & Multi-Language Integration Recipes

---

## 1. Python Integration Recipe

Integrate `.rmd` documents into Python agent loops (LangChain, LlamaIndex, CrewAI, AutoGen) via CLI subprocess JSON export:

```python
import subprocess
import json

def load_rmd_agent_graph(rmd_file_path: str) -> dict:
    """Executes rmd compile/query to extract the structured AST graph."""
    cmd = ["rmd", "query", rmd_file_path, "--tokens"]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout

# Example LangChain Custom Retriever Tool
class RMDEvidenceRetriever:
    def __init__(self, rmd_path: str):
        self.rmd_path = rmd_path

    def get_grounded_evidence(self, query: str) -> list[dict]:
        cmd = ["rmd", "query", self.rmd_path, "--filter", query]
        out = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return out.stdout
```

---

## 2. Node.js Agent Pipeline

```typescript
import { parseRMD, RMDQueryEngine } from '@rmd/core';
import * as fs from 'fs';

export async function runAgentInspectionTurn(rmdFilePath: string, topic: string) {
  const content = fs.readFileSync(rmdFilePath, 'utf-8');
  const doc = parseRMD(content);
  const engine = new RMDQueryEngine(doc);

  // 1. Fetch targeted evidence pack
  const evidencePack = engine.generateEvidencePack({
    agentName: 'SurveyorAI',
    minConfidence: 0.80
  });

  // 2. Pass evidence pack directly to LLM context
  console.log(`Delivering ${evidencePack.claims.length} claims to LLM.`);
}
```
