from __future__ import annotations
import hashlib
import re
from pathlib import Path
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class DocumentChunk(BaseModel):
    chunk_id: str
    document_id: str
    chunk_index: int
    content: str
    content_hash: str
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    chapter_title: Optional[str] = None
    lesson_title: Optional[str] = None
    section_title: Optional[str] = None
    source_type: str = "SGK"
    metadata: dict = Field(default_factory=dict)

# Regex to match page markers and headers
PAGE_MARKER_RE = re.compile(r"<!--\s*page:\s*(\d+)\s*-->", re.IGNORECASE)
HEADER1_RE = re.compile(r"^#\s+(.*)$")
HEADER2_RE = re.compile(r"^##\s+(.*)$")
HEADER3_RE = re.compile(r"^###\s+(.*)$")

def generate_chunks(
    markdown_text: str,
    document_id: str,
    source_type: str,
    chunk_chars: int = 1500,
    overlap_paragraphs: int = 1,
    start_chunk_index: int = 0
) -> List[DocumentChunk]:
    """
    Statefully chunk Markdown text by paragraphs to avoid cutting formulas or tables.
    Tracks page markers and headers dynamically.
    """
    paragraphs = markdown_text.split("\n\n")
    chunks = []
    
    current_page = 1
    current_chapter = None
    current_lesson = None
    current_section = None
    
    # Pre-parse paragraphs to assign metadata to each paragraph
    parsed_paragraphs = []
    for p in paragraphs:
        p_strip = p.strip()
        if not p_strip:
            continue
            
        # Parse page marker
        page_matches = PAGE_MARKER_RE.findall(p_strip)
        if page_matches:
            current_page = int(page_matches[-1])
            
        # Parse headings
        h1_match = HEADER1_RE.match(p_strip)
        if h1_match:
            current_chapter = h1_match.group(1).strip()
        h2_match = HEADER2_RE.match(p_strip)
        if h2_match:
            current_lesson = h2_match.group(1).strip()
        h3_match = HEADER3_RE.match(p_strip)
        if h3_match:
            current_section = h3_match.group(1).strip()
            
        parsed_paragraphs.append({
            "text": p_strip,
            "page": current_page,
            "chapter": current_chapter,
            "lesson": current_lesson,
            "section": current_section
        })
        
    # Group paragraphs into chunks
    chunk_index = start_chunk_index
    i = 0
    n = len(parsed_paragraphs)
    
    while i < n:
        chunk_paragraphs = []
        char_count = 0
        pages_in_chunk = []
        
        chapter_titles = set()
        lesson_titles = set()
        section_titles = set()
        
        j = i
        # Accumulate paragraphs until limit
        while j < n:
            para = parsed_paragraphs[j]
            para_len = len(para["text"])
            
            # If this is the first paragraph of the chunk, or it fits within the limit
            if not chunk_paragraphs or (char_count + para_len + 2 <= chunk_chars):
                chunk_paragraphs.append(para["text"])
                char_count += para_len + 2
                pages_in_chunk.append(para["page"])
                
                if para["chapter"]:
                    chapter_titles.add(para["chapter"])
                if para["lesson"]:
                    lesson_titles.add(para["lesson"])
                if para["section"]:
                    section_titles.add(para["section"])
                j += 1
            else:
                break
                
        # Emit chunk
        chunk_text = "\n\n".join(chunk_paragraphs)
        content_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
        
        page_start = min(pages_in_chunk) if pages_in_chunk else None
        page_end = max(pages_in_chunk) if pages_in_chunk else None
        
        chapter_title = list(chapter_titles)[0] if chapter_titles else None
        lesson_title = list(lesson_titles)[0] if lesson_titles else None
        section_title = list(section_titles)[0] if section_titles else None
        
        external_chunk_id = f"{document_id}-c{chunk_index:03d}"
        
        chunks.append(DocumentChunk(
            chunk_id=external_chunk_id,
            document_id=document_id,
            chunk_index=chunk_index,
            content=chunk_text,
            content_hash=content_hash,
            page_start=page_start,
            page_end=page_end,
            chapter_title=chapter_title,
            lesson_title=lesson_title,
            section_title=section_title,
            source_type=source_type
        ))
        
        chunk_index += 1
        
        # Advance index with overlap
        # Move forward by the number of processed paragraphs minus the overlap
        advance = j - i
        if advance <= overlap_paragraphs:
            i = j
        else:
            i = j - overlap_paragraphs
            
        if i >= j:  # safety check to prevent infinite loop
            break
            
    return chunks
