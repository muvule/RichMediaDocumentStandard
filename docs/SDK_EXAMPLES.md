# Agent SDK & Multi-Language Integration Recipes

---

## 1. LangChain Python Document Loader & Retriever

Integrate `.rmd` documents directly into LangChain RAG pipelines using `RMDDocumentLoader` and `RMDQueryRetriever`:

```python
from examples.python.rmd_langchain import RMDDocumentLoader, RMDQueryRetriever

# 1. Ingest .rmd into atomic LangChain Document objects
loader = RMDDocumentLoader("./examples/image-report.rmd")
docs = loader.load()

print(f"Loaded {len(docs)} evidence documents.")

# 2. Query targeted evidence with confidence filtering
retriever = RMDQueryRetriever("./examples/image-report.rmd", min_confidence=0.85)
evidence = retriever.get_relevant_documents("micro-fracture")
```

---

## 2. LlamaIndex Python Node Reader

Ingest `.rmd` documents into LlamaIndex query nodes with spatial coordinates and claims:

```python
from examples.python.rmd_llamaindex import RMDLlamaIndexReader

reader = RMDLlamaIndexReader("./examples/image-report.rmd")
nodes = reader.load_data()
```

---

## 3. Node.js & TypeScript LangChain Integration

```typescript
import { parseRMD, RMDDocumentLoader, RMDQueryRetriever } from '@rmd/core';
import * as fs from 'fs';

const content = fs.readFileSync('./examples/image-report.rmd', 'utf-8');

// 1. Ingest into LangChain Documents
const loader = new RMDDocumentLoader(content, 'image-report.rmd');
const docs = loader.load();

// 2. Query with custom retriever
const doc = parseRMD(content);
const retriever = new RMDQueryRetriever(doc, { minConfidence: 0.85 });
const results = await retriever.getRelevantDocuments('hotspot');
```

