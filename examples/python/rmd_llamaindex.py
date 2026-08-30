"""
Rich Media Document (RMD) - LlamaIndex Python Adapter Reference
Author: muvule | License: Apache 2.0

Demonstrates how to load .rmd documents into LlamaIndex Document nodes
with structured metadata for multimodal RAG query pipelines.
"""

import subprocess
import json
from typing import List, Dict, Any

class RMDLlamaIndexReader:
    """
    Reader for LlamaIndex to ingest .rmd rich media files into multimodal query nodes.
    """
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load_data(self) -> List[Dict[str, Any]]:
        result = subprocess.run(
            ["npx", "@rmd/cli", "export", self.file_path, "--format", "canonical"],
            capture_output=True,
            text=True,
            check=True
        )
        graph = json.loads(result.stdout)
        doc_id = graph.get("documentId", "doc:untitled")

        nodes = []

        for anno in graph.get("annotations", []):
            claim = anno.get("claim", "")
            target = anno.get("target", "")
            selector = anno.get("selector", {})
            confidence = anno.get("confidence", 1.0)

            node_text = (
                f"Fact: {claim}\n"
                f"Source Media ID: {target}\n"
                f"Selector Coordinates: {json.dumps(selector)}"
            )

            nodes.append({
                "text": node_text,
                "extra_info": {
                    "doc_id": doc_id,
                    "target_media": target,
                    "selector": selector,
                    "confidence": confidence,
                    "annotation_id": anno.get("id")
                }
            })

        return nodes


if __name__ == "__main__":
    import sys
    sample_file = sys.argv[1] if len(sys.argv) > 1 else "./examples/image-report.rmd"
    print(f"Reading RMD document for LlamaIndex: {sample_file}")
    reader = RMDLlamaIndexReader(sample_file)
    nodes = reader.load_data()
    print(f"Generated {len(nodes)} LlamaIndex query nodes.\n")
    for n in nodes[:2]:
        print(f"Node Text:\n{n['text']}\nMetadata: {n['extra_info']}\n")
