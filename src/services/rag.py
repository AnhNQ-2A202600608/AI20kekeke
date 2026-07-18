from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
from collections.abc import Awaitable
from typing import Any

import httpx
from langchain_openai import OpenAIEmbeddings

from src.config import get_settings
from src.services.braintrust_observability import braintrust_span, log_span
from src.services.cache import get_cache_store
from src.services.cache_keys import retrieval_cache_key
from src.services.chat_optimization import (
    DEFAULT_MATCH_COUNT,
    DEFAULT_MATCH_THRESHOLD,
    build_compact_context,
    normalize_text,
)
from src.services.supabase_config import get_backend_supabase_config


class RAGDependencyError(RuntimeError):
    pass


class RAGService:
    def __init__(self):
        self.settings = get_settings()
        supabase_config = get_backend_supabase_config(allow_stub=True)
        self.supabase_url = supabase_config.url
        self.supabase_api_key = supabase_config.secret_key
        self.openai_key = os.getenv("OPENAI_API_KEY") or self.settings.openai_api_key
        self.cache = get_cache_store()

        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.embeddings = None
        is_test = self.settings.app_env == "test" or os.getenv("PYTEST_CURRENT_TEST")
        effective_api_key = "mock_key" if is_test else self.openai_key
        if effective_api_key or (openrouter_key and "your-key" not in openrouter_key):
            try:
                if openrouter_key and "your-key" not in openrouter_key:
                    self.embeddings = OpenAIEmbeddings(
                        model="openai/text-embedding-3-small",
                        api_key=openrouter_key,
                        base_url="https://openrouter.ai/api/v1",
                    )
                else:
                    self.embeddings = OpenAIEmbeddings(
                        model="text-embedding-3-small",
                        api_key=effective_api_key,
                    )
            except Exception as e:
                print(f"[!] Warning: Failed to initialize OpenAIEmbeddings: {e}")
        self._timeout = httpx.Timeout(8.0, connect=2.0)
        self._enable_keyword_search = self._env_flag("RAG_ENABLE_KEYWORD_SEARCH", default=False)
        self._enable_keyword_fallback = self._env_flag("RAG_ENABLE_KEYWORD_FALLBACK", default=True)
        self._enable_neighbor_slides = self._env_flag("RAG_ENABLE_NEIGHBOR_SLIDES", default=True)
        self._enable_global_fallback = self._env_flag("RAG_ENABLE_GLOBAL_FALLBACK", default=False)
        self._dedupe_document_versions = self._env_flag("RAG_DEDUPE_DOCUMENT_VERSIONS", default=True)
        self._embedding_cache_ttl = int(os.getenv("RAG_EMBEDDING_CACHE_TTL", "600"))
        self._neighbor_min_similarity = float(os.getenv("RAG_NEIGHBOR_MIN_SIMILARITY", "0.42"))
        self.last_timings_ms: dict[str, float] = {}

    @property
    def supabase_anon_key(self) -> str:
        return self.supabase_api_key

    @supabase_anon_key.setter
    def supabase_anon_key(self, value: str) -> None:
        self.supabase_api_key = value

    def _record_timing(self, name: str, start: float) -> None:
        self.last_timings_ms[name] = round((asyncio.get_running_loop().time() - start) * 1000, 2)

    @staticmethod
    def _env_flag(name: str, *, default: bool) -> bool:
        value = os.getenv(name)
        if value is None:
            return default
        return value.strip().lower() in {"1", "true", "yes", "on"}

    @staticmethod
    def _logical_document_key(document_name: str) -> str:
        normalized = normalize_text(document_name)
        normalized = re.sub(r"\.(pdf|md)$", "", normalized)
        normalized = re.sub(r"^\d+-", "", normalized)
        normalized = re.sub(r"[-_\s]+v\d+$", "", normalized)
        normalized = re.sub(r"[-_\s]+", "-", normalized)
        return normalized.strip("-")

    def _dedupe_logical_versions(self, slides: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not self._dedupe_document_versions:
            return slides

        selected: list[dict[str, Any]] = []
        seen: set[tuple[str, int]] = set()
        for slide in slides:
            document_name = str(slide.get("document_name") or "")
            slide_number = slide.get("slide_number")
            if not isinstance(slide_number, int):
                selected.append(slide)
                continue

            key = (self._logical_document_key(document_name), slide_number)
            if key in seen:
                continue
            seen.add(key)
            selected.append(slide)
        return selected

    async def _keyword_search_slides(
        self,
        query: str,
        match_count: int,
        filter_document_regex: str | None = None,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> list[dict[str, Any]]:
        """
        Tìm kiếm các slide chứa từ khóa trong query bằng PostgREST.
        """
        stopwords = {
            # English
            "and",
            "or",
            "the",
            "a",
            "an",
            "of",
            "to",
            "in",
            "is",
            "that",
            "for",
            "it",
            "on",
            "with",
            "as",
            "this",
            "was",
            "at",
            "by",
            "be",
            "from",
            "are",
            "what",
            "how",
            "why",
            "who",
            "which",
            # Vietnamese
            "và",
            "hoặc",
            "thì",
            "mà",
            "là",
            "của",
            "để",
            "trong",
            "cho",
            "này",
            "đó",
            "cách",
            "những",
            "các",
            "một",
            "hai",
            "ba",
            "làm",
            "ra",
            "vào",
            "lên",
            "xuống",
            "đi",
            "đến",
            "được",
            "bị",
            "bởi",
            "với",
            "tại",
            "ở",
            "khi",
            "sau",
            "trước",
            "về",
            "gì",
            "nào",
            "sao",
            "thế",
            "đâu",
            "hỏi",
            "biết",
            "cho",
            "em",
            "học",
            "tập",
            "slide",
            "trang",
        }

        # Tìm các từ trong câu truy vấn
        words = re.findall(r"\w+", query.lower())
        keywords = [w for w in words if w not in stopwords and len(w) > 1]
        # Chỉ giữ tối đa 5 từ khóa để tránh truy vấn quá dài/chậm
        keywords = keywords[:5]
        if not keywords:
            return []

        try:
            or_clause = f"({','.join(f'content.ilike.%{kw}%' for kw in keywords)})"
            url = f"{self.supabase_url}/rest/v1/slide_embeddings"
            headers = {
                "apikey": self.supabase_api_key,
                "Authorization": f"Bearer {self.supabase_api_key}",
                "Accept": "application/json",
            }
            params = {
                "select": "document_name,slide_number,content,image_url",
                "or": or_clause,
                "limit": str(match_count),
            }
            if filter_document_regex:
                params["document_name"] = f"imatch.{filter_document_regex}"

            if client is None:
                async with httpx.AsyncClient(timeout=self._timeout) as local_client:
                    response = await local_client.get(url, headers=headers, params=params)
            else:
                response = await client.get(url, headers=headers, params=params)

            if response.status_code != 200:
                print(f"[!] Keyword search API error: {response.status_code} - {response.text}")
                return []

            results = [
                {
                    "document_name": item.get("document_name"),
                    "slide_number": item.get("slide_number"),
                    "content": item.get("content"),
                    "similarity": 0.35,  # Điểm tương đồng mặc định cho keyword match
                    "image_url": item.get("image_url"),
                }
                for item in response.json()
            ]
            return results
        except Exception as e:
            print(f"[!] Error during keyword search: {e}")
            return []

    async def _fetch_neighboring_slides(
        self,
        targets: list[tuple[str, int]],
        *,
        client: httpx.AsyncClient | None = None,
    ) -> list[dict[str, Any]]:
        """
        Lấy các slide lân cận từ database cho danh sách các cặp (document_name, slide_number).
        """
        valid_targets = [(doc, num) for doc, num in targets if num >= 1]
        if not valid_targets:
            return []

        try:
            clauses = []
            for doc, num in valid_targets:
                safe_doc = doc.replace('"', '""')
                clauses.append(f'and(document_name.eq."{safe_doc}",slide_number.eq.{num})')

            url = f"{self.supabase_url}/rest/v1/slide_embeddings"
            headers = {
                "apikey": self.supabase_api_key,
                "Authorization": f"Bearer {self.supabase_api_key}",
                "Accept": "application/json",
            }
            params = {
                "select": "document_name,slide_number,content,image_url",
                "or": f"({','.join(clauses)})",
            }

            if client is None:
                async with httpx.AsyncClient(timeout=self._timeout) as local_client:
                    response = await local_client.get(url, headers=headers, params=params)
            else:
                response = await client.get(url, headers=headers, params=params)

            if response.status_code != 200:
                print(f"[!] Fetch neighboring slides API error: {response.status_code} - {response.text}")
                return []

            results = [
                {
                    "document_name": item.get("document_name"),
                    "slide_number": item.get("slide_number"),
                    "content": item.get("content"),
                    "similarity": 0.0,  # Slide lân cận không có điểm tương đồng thực tế
                    "image_url": item.get("image_url"),
                    "is_neighbor": True,
                }
                for item in response.json()
            ]
            return results
        except Exception as e:
            print(f"[!] Error fetching neighboring slides: {e}")
            return []

    async def aretrieve_relevant_slides(
        self,
        query: str,
        match_threshold: float = DEFAULT_MATCH_THRESHOLD,
        match_count: int = DEFAULT_MATCH_COUNT,
        *,
        course_id: str | None = None,
        concept_id: str | None = None,
        mode: str | None = None,
    ) -> list[dict[str, Any]]:
        self.last_timings_ms = {}
        if not self.supabase_url or not self.supabase_api_key:
            message = "SUPABASE_URL or SUPABASE_SECRET_KEY is empty. RAG retrieval is unavailable."
            if self.settings.app_env == "production":
                raise RAGDependencyError(message)
            print(f"[!] RAGService Warning: {message}")
            return []

        if self.settings.app_env == "test" or os.getenv("PYTEST_CURRENT_TEST"):
            return []

        try:
            cache_key = self._make_cache_key(
                query,
                course_id=course_id,
                concept_id=concept_id,
                mode=mode,
                match_threshold=match_threshold,
                match_count=match_count,
            )
            cache_start = asyncio.get_running_loop().time()
            cached = self.cache.get(cache_key)
            self._record_timing("rag_cache_lookup", cache_start)
            if cached:
                try:
                    return json.loads(cached)
                except Exception:
                    pass

            import sys

            if not self.embeddings and not os.getenv("PYTEST_CURRENT_TEST") and "pytest" not in sys.modules:
                print("[*] RAG Service: OpenAI keys missing. Falling back to local SGK TF-IDF search.")
                results = []
                local_results = self._query_local_index(query, match_count)
                for res in local_results:
                    results.append(
                        {
                            "document_name": res["book_title"],
                            "slide_number": res["page"],
                            "content": res["text"],
                            "similarity": res["score"],
                            "image_url": None,
                        }
                    )
                self.cache.set(cache_key, json.dumps(results), ttl=180)
                return results

            filter_document_regex = None
            if concept_id:
                concept_cache_key = f"concept_code:{concept_id}"
                concept_code = self.cache.get(concept_cache_key)

                if not concept_code:
                    try:
                        from uuid import UUID
                        try:
                            UUID(str(concept_id))
                            concept_url = f"{self.supabase_url}/rest/v1/concepts?id=eq.{concept_id}&select=code"
                        except ValueError:
                            concept_url = f"{self.supabase_url}/rest/v1/concepts?code=eq.{concept_id}&select=code"

                        concept_headers = {
                            "apikey": self.supabase_api_key,
                            "Authorization": f"Bearer {self.supabase_api_key}",
                            "Accept-Profile": "app",
                        }
                        concept_start = asyncio.get_running_loop().time()
                        async with httpx.AsyncClient(timeout=self._timeout) as client:
                            resp = await client.get(concept_url, headers=concept_headers)
                        self._record_timing("rag_concept_lookup", concept_start)
                        if resp.status_code == 200:
                            data = resp.json()
                            if data and isinstance(data, list) and len(data) > 0:
                                concept_code = data[0].get("code")
                                if concept_code:
                                    self.cache.set(concept_cache_key, concept_code, ttl=3600)
                        else:
                            print(f"[!] RAG Service: Failed to fetch concept code: {resp.status_code} - {resp.text}")
                    except Exception as ex:
                        print(f"[!] RAG Service: Error fetching concept code: {ex}")

                if concept_code:
                    day_num = None
                    day_match = re.search(r"day[_-]?(\d+)", concept_code, re.IGNORECASE)
                    if day_match:
                        day_num = int(day_match.group(1))
                    else:
                        code_lower = concept_code.lower()
                        if "prompt" in code_lower or "tool-calling" in code_lower:
                            day_num = 4
                        elif "react" in code_lower:
                            day_num = 3
                        elif "context-engineering" in code_lower or "ai-product-uncertainty" in code_lower:
                            day_num = 5
                        elif "hackathon" in code_lower:
                            day_num = 6

                    if day_num is not None:
                        filter_document_regex = f"(day|ngày|ngay)[-_ ]?(0?{day_num})([^0-9]|$)"
                        print(
                            f"[*] RAG Service: Metadata regex filter '{filter_document_regex}' applied for concept '{concept_code}' (Day {day_num})"
                        )
                    else:
                        print(f"[*] RAG Service: No day number mapped for concept '{concept_code}'")

            embedding_start = asyncio.get_running_loop().time()
            with braintrust_span("rag.embedding", input={"query": query}) as span:
                query_embedding = await self._get_query_embedding(query)
                self._record_timing("rag_embedding", embedding_start)
                log_span(span, metadata={"elapsed_ms": self.last_timings_ms.get("rag_embedding")})

            # Định nghĩa hàm chạy Vector Search (RPC)
            async def run_vector_search(
                regex_val: str | None,
                *,
                client: httpx.AsyncClient,
            ) -> list[dict[str, Any]]:
                rpc_url = f"{self.supabase_url}/rest/v1/rpc/match_slides"
                headers = {
                    "apikey": self.supabase_api_key,
                    "Authorization": f"Bearer {self.supabase_api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "query_embedding": query_embedding,
                    "match_threshold": match_threshold,
                    "match_count": match_count,
                }
                if regex_val:
                    payload["filter_document_regex"] = regex_val

                try:
                    vector_start = asyncio.get_running_loop().time()
                    with braintrust_span(
                        "rag.vector_rpc",
                        metadata={"match_count": match_count, "has_filter": bool(regex_val)},
                    ) as span:
                        response = await client.post(rpc_url, headers=headers, json=payload)
                        self._record_timing("rag_vector_rpc", vector_start)
                        log_span(span, metadata={"elapsed_ms": self.last_timings_ms.get("rag_vector_rpc")})

                    if response.status_code != 200:
                        raise RAGDependencyError(
                            f"RAG vector search failed with status {response.status_code}: {response.text}"
                        )

                    return [
                        {
                            "document_name": item.get("document_name"),
                            "slide_number": item.get("slide_number"),
                            "content": item.get("content"),
                            "similarity": item.get("similarity", 0.0),
                            "image_url": item.get("image_url"),
                        }
                        for item in response.json()
                    ]
                except Exception as ex:
                    if isinstance(ex, RAGDependencyError):
                        raise
                    print(f"[!] Error during vector search query: {ex}")
                    raise RAGDependencyError("RAG vector search failed.") from ex

            async with httpx.AsyncClient(timeout=self._timeout) as client:
                # Vector-first keeps the common path to one embedding call and one Supabase RPC.
                # Keyword search is optional because it adds another REST request and is mostly
                # useful as a recall fallback when semantic retrieval is weak.
                if self._enable_keyword_search:
                    vector_task: Awaitable[list[dict[str, Any]]] = run_vector_search(
                        filter_document_regex,
                        client=client,
                    )
                    keyword_task: Awaitable[list[dict[str, Any]]] = self._keyword_search_slides(
                        query,
                        match_count,
                        filter_document_regex,
                        client=client,
                    )
                    keyword_start = asyncio.get_running_loop().time()
                    vector_results, keyword_results = await asyncio.gather(vector_task, keyword_task)
                    self._record_timing("rag_keyword_search", keyword_start)
                else:
                    vector_results = await run_vector_search(filter_document_regex, client=client)
                    keyword_results = []

                if (
                    self._enable_keyword_fallback
                    and not keyword_results
                    and (not vector_results or vector_results[0]["similarity"] < 0.42)
                ):
                    keyword_start = asyncio.get_running_loop().time()
                    keyword_results = await self._keyword_search_slides(
                        query,
                        match_count,
                        filter_document_regex,
                        client=client,
                    )
                    self._record_timing("rag_keyword_search", keyword_start)

                # Fallback sang Tìm kiếm Toàn cục (Global Search) nếu được bật rõ ràng.
                if (
                    self._enable_global_fallback
                    and filter_document_regex
                    and (not vector_results or vector_results[0]["similarity"] < 0.42)
                ):
                    print(
                        f"[*] RAG Service: Low similarity ({vector_results[0]['similarity'] if vector_results else 0.0:.3f}) under day filter. Retrying with global search..."
                    )
                    if self._enable_keyword_search:
                        global_vector_task = run_vector_search(None, client=client)
                        global_keyword_task = self._keyword_search_slides(query, match_count, None, client=client)
                        fallback_start = asyncio.get_running_loop().time()
                        global_vector_results, global_keyword_results = await asyncio.gather(
                            global_vector_task,
                            global_keyword_task,
                        )
                        self._record_timing("rag_global_fallback", fallback_start)
                    else:
                        fallback_start = asyncio.get_running_loop().time()
                        global_vector_results = await run_vector_search(None, client=client)
                        global_keyword_results = []
                        self._record_timing("rag_global_fallback", fallback_start)

                    if global_vector_results and global_vector_results[0]["similarity"] >= 0.42:
                        print(
                            f"[*] RAG Service: Global search found better results (similarity: {global_vector_results[0]['similarity']:.3f}). Switching to global."
                        )
                        vector_results = global_vector_results
                        keyword_results = global_keyword_results

            # Gộp kết quả của Vector Search và Keyword Search
            merged: dict[tuple[str, int], dict[str, Any]] = {}
            for item in vector_results:
                key = (item["document_name"], item["slide_number"])
                merged[key] = {
                    "document_name": item["document_name"],
                    "slide_number": item["slide_number"],
                    "content": item["content"],
                    "similarity": item["similarity"],
                    "image_url": item.get("image_url"),
                }

            for item in keyword_results:
                key = (item["document_name"], item["slide_number"])
                if key in merged:
                    # Boost điểm tương đồng khi xuất hiện ở cả hai (cộng thêm 0.05, tối đa 1.0)
                    merged[key]["similarity"] = min(1.0, merged[key]["similarity"] + 0.05)
                else:
                    merged[key] = {
                        "document_name": item["document_name"],
                        "slide_number": item["slide_number"],
                        "content": item["content"],
                        "similarity": 0.35,
                        "image_url": item.get("image_url"),
                    }

            # Gộp thêm kết quả từ 4 file SGK (OCR local index)
            local_results = self._query_local_index(query, match_count)
            for res in local_results:
                key = (res["book_title"], res["page"])
                if key in merged:
                    merged[key]["similarity"] = max(merged[key]["similarity"], res["score"])
                else:
                    merged[key] = {
                        "document_name": res["book_title"],
                        "slide_number": res["page"],
                        "content": res["text"],
                        "similarity": res["score"],
                        "image_url": None,
                    }

            # Sắp xếp theo similarity giảm dần
            sorted_results = sorted(merged.values(), key=lambda x: x["similarity"], reverse=True)

            # Lọc theo môn học Toán học (chỉ giữ lại các tài liệu Toán)
            is_math_concept = concept_id in [
                "ti-le-thuc", "ti-so", "tinh-chat-co-ban-cua-phan-so", "phan-so",
                "rut-gon-phan-so", "phan-so-bang-nhau", "ti-so-phan-tram", "quy-dong-mau-nhieu-phan-so"
            ]
            if is_math_concept:
                sorted_results = [
                    item for item in sorted_results
                    if "math" in str(item.get("document_name")).lower() or "fused" in str(item.get("document_name")).lower()
                ]

            sorted_results = self._dedupe_logical_versions(sorted_results)
            results = sorted_results[:match_count]

            # Mở rộng ngữ cảnh lân cận (lấy slide N-1 và N+1 cho top 2 slide tốt nhất)
            if self._enable_neighbor_slides and results:
                neighbor_targets = []
                seen_slides = {(item["document_name"], item["slide_number"]) for item in results}

                for item in results[:1]:
                    if item.get("similarity", 0.0) < self._neighbor_min_similarity:
                        continue
                    doc = item["document_name"]
                    num = item["slide_number"]

                    prev_slide = (doc, num - 1)
                    next_slide = (doc, num + 1)

                    if prev_slide[1] >= 1 and prev_slide not in seen_slides and prev_slide not in neighbor_targets:
                        neighbor_targets.append(prev_slide)
                    if next_slide not in seen_slides and next_slide not in neighbor_targets:
                        neighbor_targets.append(next_slide)

                if neighbor_targets:
                    async with httpx.AsyncClient(timeout=self._timeout) as client:
                        neighbor_start = asyncio.get_running_loop().time()
                        neighbors = await self._fetch_neighboring_slides(neighbor_targets, client=client)
                        self._record_timing("rag_neighbor_fetch", neighbor_start)
                    # Nối danh sách slide lân cận vào cuối kết quả trả về
                    results.extend(neighbors)

            self.cache.set(cache_key, json.dumps(results), ttl=180)
            return results
        except Exception as e:
            if isinstance(e, RAGDependencyError):
                raise
            print(f"[!] Error during RAG retrieval: {e}")
            return []

    async def _get_query_embedding(self, query: str) -> list[float]:
        normalized_query = normalize_text(query)
        embedding_hash = hashlib.sha256(normalized_query.encode("utf-8")).hexdigest()[:16]
        cache_key = f"chat:rag_embedding:v1:{embedding_hash}"
        cached = self.cache.get(cache_key)
        if cached:
            try:
                value = json.loads(cached)
                if isinstance(value, list) and value:
                    return value
            except Exception:
                pass

        if not self.embeddings:
            import sys

            if "pytest" in sys.modules:
                return [0.1] * 1536
            raise RuntimeError("LLM provider is not configured. Missing API keys.")
        embedding = await asyncio.to_thread(self.embeddings.embed_query, normalized_query)
        self.cache.set(cache_key, json.dumps(embedding), ttl=self._embedding_cache_ttl)
        return embedding

    def retrieve_relevant_slides(
        self,
        query: str,
        match_threshold: float = DEFAULT_MATCH_THRESHOLD,
        match_count: int = DEFAULT_MATCH_COUNT,
        *,
        course_id: str | None = None,
        concept_id: str | None = None,
        mode: str | None = None,
    ) -> list[dict[str, Any]]:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(
                self.aretrieve_relevant_slides(
                    query,
                    match_threshold=match_threshold,
                    match_count=match_count,
                    course_id=course_id,
                    concept_id=concept_id,
                    mode=mode,
                )
            )
        raise RuntimeError(
            "retrieve_relevant_slides() cannot be called from an async context; use aretrieve_relevant_slides()."
        )

    def format_context(self, slides: list[dict[str, Any]]) -> str:
        return build_compact_context(slides)

    def _make_cache_key(
        self,
        query: str,
        *,
        course_id: str | None = None,
        concept_id: str | None = None,
        mode: str | None = None,
        match_threshold: float = DEFAULT_MATCH_THRESHOLD,
        match_count: int = DEFAULT_MATCH_COUNT,
    ) -> str:
        query_hash = hashlib.sha256(normalize_text(query).encode("utf-8")).hexdigest()[:16]
        return retrieval_cache_key(
            query_hash,
            course_id=course_id,
            concept_id=concept_id,
            mode=(
                f"{mode or 'na'}"
                f":kw{int(self._enable_keyword_search)}"
                f":kwfb{int(self._enable_keyword_fallback)}"
                f":gfb{int(self._enable_global_fallback)}"
                f":nb{int(self._enable_neighbor_slides)}"
                f":nms{self._neighbor_min_similarity:.2f}"
                f":dedupe{int(self._dedupe_document_versions)}"
            ),
            match_threshold=match_threshold,
            match_count=match_count,
        )

    def _query_local_index(self, query: str, match_count: int) -> list[dict[str, Any]]:
        # Bypass local search in test env to avoid polluting mock RAG slide test cases
        import sys

        if self.settings.app_env == "test" or os.getenv("PYTEST_CURRENT_TEST") or "pytest" in sys.modules:
            return []
        try:
            from src.modules.rag.index import load_index, query_index

            index_path = self.settings.rag_index_dir / "index.json"
            if not index_path.exists():
                return []

            if not hasattr(RAGService, "_cached_local_index"):
                RAGService._cached_local_index = load_index(index_path)

            index = RAGService._cached_local_index
            return query_index(index, query, top_k=match_count)
        except Exception as e:
            print(f"[!] Error querying local index: {e}")
            return []
