"""
Rich Media Document (RMD) - LangChain Python Adapter Reference
Author: muvule | License: Apache 2.0

Demonstrates how to load .rmd documents into LangChain Document objects
and query grounded evidence anchors without blowing up the LLM context window.
"""

import subprocess
import json
from typing import List, Optional, Dict, Any

class RMDDocumentLoader:
    """
    Loads an RMD (.rmd) document into atomic, grounded LangChain Document slices.
    """
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self) -> List[Dict[str, Any]]:
        # Export canonical agent graph via CLI or direct parser
        result = subprocess.run(
            ["npx", "@rmd/cli", "export", self.file_path, "--format", "canonical"],
            capture_output=True,
            text=True,
            check=True
        )
        graph = json.loads(result.stdout)
        doc_id = graph.get("documentId", "doc:untitled")

        documents = []

        # 1. Document Level Overview
        documents.append({
            "page_content": f"Document ID: {doc_id}\nTotal Nodes: {len(graph.get('nodes', []))}",
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
            label = anno.get("body", {}).get("label", anno.get("type", "feature"))

            content = (
                f"[EVIDENCE ANCHOR]\n"
                f"Label: {label}\n"
                f"Claim: {claim}\n"
                f"Target Media: {target}\n"
                f"Selector: {json.dumps(selector)}\n"
                f"Confidence: {confidence * 100:.1f}%"
            )

            documents.append({
                "page_content": content,
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
        # Query targeted evidence via CLI
        result = subprocess.run(
            ["npx", "@rmd/cli", "query", self.file_path, "--filter", query, "--evidence-pack"],
            capture_output=True,
            text=True,
            check=True
        )
        pack = json.loads(result.stdout)
        
        relevant_docs = []
        for claim in pack.get("claims", []):
            conf = claim.get("confidence", 1.0)
            if conf >= self.min_confidence:
                relevant_docs.append({
                    "page_content": f"[GROUNDED CLAIM] {claim.get('statement')}",
                    "metadata": {
                        "claim_id": claim.get("id"),
                        "target_media": claim.get("evidence", {}).get("mediaAssetId"),
                        "location": claim.get("evidence", {}).get("location"),
                        "confidence": conf
                    }
                })
        return relevant_docs


if __name__ == "__main__":
    import sys
    sample_file = sys.argv[1] if len(sys.argv) > 1 else "./examples/image-report.rmd"
    print(f"Loading RMD document: {sample_file}")
    loader = RMDDocumentLoader(sample_file)
    docs = loader.load()
    print(f"Successfully loaded {len(docs)} LangChain document slices.\n")
    for d in docs[:3]:
        print(f"--- {d['metadata'].get('type', 'evidence')} ---")
        print(d["page_content"])
        print()
