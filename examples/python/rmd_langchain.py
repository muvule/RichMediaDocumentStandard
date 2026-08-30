"""
Rich Media Document (RMD) - LangChain Python Adapter Reference
Author: muvule | License: Apache 2.0

Demonstrates how to load .rmd documents into LangChain Document objects
and query grounded evidence anchors without blowing up the LLM context window.
Uses pure Python in-memory parser (zero external dependencies).
"""

import os
import sys
import json
from typing import List, Optional, Dict, Any

# Import lightweight pure-Python RMD parser
try:
    from rmd_core import parse_rmd, RMDDocument
except ImportError:
    from examples.python.rmd_core import parse_rmd, RMDDocument


class RMDDocumentLoader:
    """
    Loads an RMD (.rmd) document into atomic, grounded LangChain Document slices.
    """
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self) -> List[Dict[str, Any]]:
        with open(self.file_path, "r", encoding="utf-8") as f:
            content = f.read()

        doc = parse_rmd(content)
        graph = doc.to_agent_graph()
        doc_id = graph.get("documentId", "doc:untitled")

        documents = []

        # 1. Document Level Overview
        documents.append({
            "page_content": f"Document ID: {doc_id}\nTitle: {graph.get('title', '')}\nSpec: {graph.get('spec', '0.1')}",
            "metadata": {
                "source": self.file_path,
                "document_id": doc_id,
                "type": "document_overview"
            }
        })

        # 2. Extract Evidence Anchors
        for anno in graph.get("annotations", []):
            claim = anno.get("claim", "Evidence observation")
            target = anno.get("target")
            selector = anno.get("selector", {})
            confidence = anno.get("confidence", 1.0)
            label = anno.get("body", {}).get("label", anno.get("type", "feature")) if isinstance(anno.get("body"), dict) else anno.get("type", "feature")

            content_text = (
                f"[EVIDENCE ANCHOR]\n"
                f"Label: {label}\n"
                f"Claim: {claim}\n"
                f"Target Media: {target}\n"
                f"Selector: {json.dumps(selector)}\n"
                f"Confidence: {float(confidence) * 100:.1f}%"
            )

            documents.append({
                "page_content": content_text,
                "metadata": {
                    "source": self.file_path,
                    "document_id": doc_id,
                    "annotation_id": anno.get("id"),
                    "target_media": target,
                    "selector": selector,
                    "confidence": confidence,
                    "label": label
                }
            })

        return documents


class RMDQueryRetriever:
    """
    Custom Retriever filtering evidence anchors by query filter and confidence.
    """
    def __init__(self, file_path: str, min_confidence: float = 0.8):
        self.file_path = file_path
        self.min_confidence = min_confidence

    def get_relevant_documents(self, query: str) -> List[Dict[str, Any]]:
        with open(self.file_path, "r", encoding="utf-8") as f:
            content = f.read()

        doc = parse_rmd(content)
        matches = doc.find_evidence(query)
        
        relevant_docs = []
        for anno in matches:
            conf = float(anno.get("confidence", 1.0))
            if conf >= self.min_confidence:
                claim = anno.get("claim", "")
                target = anno.get("target", "")
                selector = anno.get("selector", {})
                relevant_docs.append({
                    "page_content": f"[GROUNDED CLAIM] {claim}\nTarget: {target}\nSelector: {json.dumps(selector)}",
                    "metadata": {
                        "annotation_id": anno.get("id"),
                        "target_media": target,
                        "location": selector,
                        "confidence": conf
                    }
                })
        return relevant_docs


if __name__ == "__main__":
    sample_file = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "image-report.rmd")
    print(f"Loading RMD document: {sample_file}")
    loader = RMDDocumentLoader(sample_file)
    docs = loader.load()
    print(f"Successfully loaded {len(docs)} LangChain document slices.\n")
    for d in docs[:3]:
        print(f"--- {d['metadata'].get('type', 'evidence')} ---")
        print(d["page_content"])
        print()
