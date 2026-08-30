"""
Rich Media Document (RMD) - Pure Python Zero-Dependency Reference Parser
Author: muvule | License: Apache 2.0

Lightweight, high-performance RMD parser written in standard Python 3.
Zero third-party dependencies. Parses frontmatter and typed rmd:* blocks.
"""

import re
import json
from typing import Dict, List, Any, Optional

class RMDBlock:
    def __init__(self, block_type: str, attrs: Dict[str, Any], raw: str):
        self.block_type = block_type
        self.attrs = attrs
        self.raw = raw

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.block_type,
            "attrs": self.attrs,
            "raw": self.raw
        }


def _parse_yaml_simple(text: str) -> Dict[str, Any]:
    """
    Lightweight, robust indentation-aware YAML-subset parser for RMD blocks.
    Supports scalars, lists, nested dicts, numbers, and booleans without PyYAML.
    """
    lines = text.splitlines()
    root: Dict[str, Any] = {}
    stack: List[tuple] = [(-1, root)]  # (indent_level, dict_or_list)

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            i += 1
            continue

        indent = len(line) - len(line.lstrip())

        # Pop stack until parent indent is less than current indent
        while len(stack) > 1 and stack[-1][0] >= indent:
            stack.pop()

        current_parent = stack[-1][1]

        # Key-value or list item
        if stripped.startswith("- "):
            # List item
            val_str = stripped[2:].strip()
            val = _parse_val(val_str)
            if isinstance(current_parent, list):
                current_parent.append(val)
            elif isinstance(current_parent, dict):
                # Fallback if list inside dict without explicit key
                pass
            i += 1
            continue

        if ":" in stripped:
            key, rest = stripped.split(":", 1)
            key = key.strip()
            rest = rest.strip()

            if not rest:
                # Nested object or list follows
                # Peek next line to see if it's a list or dict
                next_indent = -1
                is_list = False
                for j in range(i + 1, len(lines)):
                    nxt = lines[j]
                    if nxt.strip() and not nxt.strip().startswith("#"):
                        next_indent = len(nxt) - len(nxt.lstrip())
                        is_list = nxt.strip().startswith("- ")
                        break

                new_container: Any = [] if is_list else {}
                if isinstance(current_parent, dict):
                    current_parent[key] = new_container
                stack.append((indent, new_container))
            else:
                val = _parse_val(rest)
                if isinstance(current_parent, dict):
                    current_parent[key] = val

        i += 1

    return root


def _parse_val(val_str: str) -> Any:
    val_str = val_str.strip()
    if val_str.startswith('"') and val_str.endswith('"'):
        return val_str[1:-1].replace('\\"', '"')
    if val_str.startswith("'") and val_str.endswith("'"):
        return val_str[1:-1]
    if val_str.startswith("[") and val_str.endswith("]"):
        items = [s.strip() for s in val_str[1:-1].split(",") if s.strip()]
        return [_parse_val(it) for it in items]
    if val_str.lower() == "true":
        return True
    if val_str.lower() == "false":
        return False
    if val_str.lower() == "null":
        return None
    try:
        if "." in val_str:
            return float(val_str)
        return int(val_str)
    except ValueError:
        return val_str


class RMDDocument:
    def __init__(self, raw_text: str):
        self.raw_text = raw_text
        self.frontmatter: Dict[str, Any] = {}
        self.blocks: List[RMDBlock] = []
        self.assets: List[Dict[str, Any]] = []
        self.annotations: List[Dict[str, Any]] = []
        self.semantic: List[Dict[str, Any]] = []
        self._parse()

    def _parse(self):
        # 1. Frontmatter
        fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", self.raw_text, re.DOTALL)
        content_after_fm = self.raw_text
        if fm_match:
            fm_text = fm_match.group(1)
            self.frontmatter = _parse_yaml_simple(fm_text)
            content_after_fm = self.raw_text[fm_match.end():]

        # 2. Block Parser
        block_pattern = re.compile(
            r"```(rmd:[a-z]+)\s*\n(.*?)\n```",
            re.DOTALL
        )

        for match in block_pattern.finditer(content_after_fm):
            tag = match.group(1)
            raw_body = match.group(2)
            attrs = _parse_yaml_simple(raw_body)
            block = RMDBlock(tag, attrs, match.group(0))
            self.blocks.append(block)

            if tag == "rmd:media":
                self.assets.append(attrs)
            elif tag == "rmd:annotation":
                self.annotations.append(attrs)
            elif tag == "rmd:semantic":
                self.semantic.append(attrs)

    def to_agent_graph(self) -> Dict[str, Any]:
        return {
            "documentId": self.frontmatter.get("id", "doc:untitled"),
            "title": self.frontmatter.get("title", "Untitled"),
            "spec": self.frontmatter.get("rmd", "0.1"),
            "assets": self.assets,
            "annotations": self.annotations,
            "semantic": self.semantic
        }

    def find_evidence(self, query: str) -> List[Dict[str, Any]]:
        q = query.lower().strip()
        results = []
        for anno in self.annotations:
            claim = str(anno.get("claim", "")).lower()
            label = str(anno.get("body", {}).get("label", "")).lower() if isinstance(anno.get("body"), dict) else ""
            if q in claim or q in label:
                results.append(anno)
        return results


def parse_rmd(content: str) -> RMDDocument:
    return RMDDocument(content)
