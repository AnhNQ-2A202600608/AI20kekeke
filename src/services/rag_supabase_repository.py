from __future__ import annotations

from collections.abc import Iterable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests


class SupabaseRagError(RuntimeError):
    pass


class SupabaseRagRepository:
    """Service-role-only persistence adapter for the normalized RAG corpus."""

    def __init__(
        self,
        *,
        url: str,
        secret_key: str,
        session: requests.Session | None = None,
        signed_url_ttl_seconds: int = 300,
    ):
        if not url or not secret_key:
            raise ValueError("Supabase URL and backend secret are required")
        self.url = url.rstrip("/")
        self.secret_key = secret_key
        self.session = session or requests.Session()
        self.signed_url_ttl_seconds = min(max(signed_url_ttl_seconds, 1), 300)

    @property
    def _base_headers(self) -> dict[str, str]:
        return {
            "apikey": self.secret_key,
            "Authorization": f"Bearer {self.secret_key}",
            "Accept": "application/json",
        }

    def _request(
        self,
        method: str,
        path: str,
        *,
        schema: str | None = "app",
        **kwargs: Any,
    ) -> requests.Response:
        headers = {**self._base_headers, **kwargs.pop("headers", {})}
        if schema:
            headers["Accept-Profile"] = schema
            if method.upper() in {"POST", "PUT", "PATCH", "DELETE"}:
                headers["Content-Profile"] = schema
        response = self.session.request(method, f"{self.url}{path}", headers=headers, timeout=60, **kwargs)
        try:
            response.raise_for_status()
        except Exception as exc:
            body = getattr(response, "text", "")[:1000]
            raise SupabaseRagError(f"Supabase {method} {path} failed: {body}") from exc
        return response

    @staticmethod
    def _batches(values: list[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
        for start in range(0, len(values), size):
            yield values[start : start + size]

    def resolve_scope(self, *, course_id: str, grade_level: int, subject_code: str) -> str:
        subjects = self._request(
            "GET",
            "/rest/v1/subjects",
            schema="public",
            params={"select": "id", "code": f"eq.{subject_code}", "limit": "1"},
        ).json()
        if not subjects:
            raise SupabaseRagError(f"Unknown subject code: {subject_code}")
        response = self._request(
            "GET",
            "/rest/v1/rag_scopes",
            params={
                "select": "id",
                "course_id": f"eq.{course_id}",
                "grade_level": f"eq.{grade_level}",
                "subject_id": f"eq.{subjects[0]['id']}",
                "is_active": "eq.true",
                "limit": "1",
            },
        )
        rows = response.json()
        if not rows:
            raise SupabaseRagError(
                f"No active RAG scope for course={course_id}, grade={grade_level}, subject={subject_code}"
            )
        return str(rows[0]["id"])

    def find_published_material(self, *, scope_id: str, checksum: str) -> dict[str, Any] | None:
        response = self._request(
            "GET",
            "/rest/v1/course_materials",
            params={
                "select": "id,page_count,material_chunks(count)",
                "rag_scope_id": f"eq.{scope_id}",
                "source_checksum": f"eq.{checksum}",
                "published_status": "eq.published",
                "ingest_status": "eq.published",
                "limit": "1",
            },
        )
        rows = response.json()
        if not rows:
            return None
        row = rows[0]
        counts = row.pop("material_chunks", [])
        row["chunk_count"] = counts[0].get("count", 0) if counts else 0
        return row

    def start_ingestion(self, **values: Any) -> tuple[str, str]:
        material_path = "materials/pending/source.pdf"
        lookup = self._request(
            "GET",
            "/rest/v1/course_materials",
            params={
                "select": "id",
                "rag_scope_id": f"eq.{values['scope_id']}",
                "source_checksum": f"eq.{values['source_checksum']}",
                "limit": "1",
            },
        ).json()
        material_payload = {
            "course_id": values["course_id"],
            "rag_scope_id": values["scope_id"],
            "title": values["title"],
            "source_type": "pdf",
            "storage_uri": material_path,
            "published_status": "draft",
            "source_filename": values["source_filename"],
            "source_checksum": values["source_checksum"],
            "edition": values["edition"],
            "page_count": values["page_count"],
            "ingest_status": "processing",
        }
        representation = {"Prefer": "return=representation"}
        if lookup:
            material_id = str(lookup[0]["id"])
            self._request(
                "PATCH",
                "/rest/v1/rag_ingestion_jobs",
                params={"material_id": f"eq.{material_id}", "status": "eq.processing"},
                json={
                    "status": "failed",
                    "error_message": "Superseded by retry",
                    "finished_at": datetime.now(UTC).isoformat(),
                },
                headers={"Prefer": "return=minimal"},
            )
            material_payload["storage_uri"] = f"materials/{material_id}/source.pdf"
            rows = self._request(
                "PATCH",
                "/rest/v1/course_materials",
                params={"id": f"eq.{material_id}"},
                json=material_payload,
                headers=representation,
            ).json()
        else:
            rows = self._request(
                "POST",
                "/rest/v1/course_materials",
                json=material_payload,
                headers=representation,
            ).json()
            material_id = str(rows[0]["id"])
            self._request(
                "PATCH",
                "/rest/v1/course_materials",
                params={"id": f"eq.{material_id}"},
                json={"storage_uri": f"materials/{material_id}/source.pdf"},
                headers={"Prefer": "return=minimal"},
            )

        job = self._request(
            "POST",
            "/rest/v1/rag_ingestion_jobs",
            json={
                "material_id": material_id,
                "source_filename": values["source_filename"],
                "source_checksum": values["source_checksum"],
                "status": "processing",
                "stage": "validating",
                "total_pages": values["page_count"],
                "attempt_count": 1,
                "started_at": datetime.now(UTC).isoformat(),
            },
            headers=representation,
        ).json()
        return material_id, str(job[0]["id"])

    def update_job(self, job_id: str, *, stage: str, **values: Any) -> None:
        payload = {"stage": stage, **values}
        self._request(
            "PATCH",
            "/rest/v1/rag_ingestion_jobs",
            params={"id": f"eq.{job_id}"},
            json=payload,
            headers={"Prefer": "return=minimal"},
        )

    def _upload(self, storage_path: str, content: bytes, content_type: str) -> str:
        encoded = quote(storage_path, safe="/")
        self._request(
            "PUT",
            f"/storage/v1/object/rag-materials/{encoded}",
            schema=None,
            data=content,
            headers={"Content-Type": content_type, "x-upsert": "true"},
        )
        return storage_path

    def upload_source(self, material_id: str, pdf_path: Path) -> str:
        return self._upload(f"materials/{material_id}/source.pdf", pdf_path.read_bytes(), "application/pdf")

    def reset_draft(self, material_id: str) -> None:
        for table in ("material_chunks", "material_pages"):
            self._request(
                "DELETE",
                f"/rest/v1/{table}",
                params={"material_id": f"eq.{material_id}"},
                headers={"Prefer": "return=minimal"},
            )

    def upload_preview(self, material_id: str, page_number: int, content: bytes) -> str:
        return self._upload(f"materials/{material_id}/pages/{page_number}.webp", content, "image/webp")

    def insert_pages(self, material_id: str, records: list[dict[str, Any]]) -> dict[int, str]:
        page_ids: dict[int, str] = {}
        for batch in self._batches(records, 100):
            payload = [{"material_id": material_id, **record} for record in batch]
            rows = self._request(
                "POST",
                "/rest/v1/material_pages",
                json=payload,
                headers={"Prefer": "return=representation"},
            ).json()
            page_ids.update({int(row["page_number"]): str(row["id"]) for row in rows})
        return page_ids

    def insert_chunks(self, material_id: str, course_id: str, records: list[dict[str, Any]]) -> None:
        for batch in self._batches(records, 25):
            payload = [{"material_id": material_id, "course_id": course_id, **record} for record in batch]
            self._request(
                "POST",
                "/rest/v1/material_chunks",
                json=payload,
                headers={"Prefer": "return=minimal"},
            )

    def mark_ready(self, material_id: str, *, page_count: int) -> None:
        self._request(
            "PATCH",
            "/rest/v1/course_materials",
            params={"id": f"eq.{material_id}"},
            json={"ingest_status": "ready", "page_count": page_count},
            headers={"Prefer": "return=minimal"},
        )

    def publish_material(self, material_id: str) -> None:
        self._request(
            "POST",
            "/rest/v1/rpc/publish_rag_material",
            json={"p_material_id": material_id},
            headers={"Prefer": "return=minimal"},
        )

    def fail_ingestion(self, material_id: str, job_id: str, *, error: str) -> None:
        self._request(
            "PATCH",
            "/rest/v1/course_materials",
            params={"id": f"eq.{material_id}"},
            json={"ingest_status": "failed"},
            headers={"Prefer": "return=minimal"},
        )
        self._request(
            "PATCH",
            "/rest/v1/rag_ingestion_jobs",
            params={"id": f"eq.{job_id}"},
            json={
                "status": "failed",
                "error_message": error[:4000],
                "finished_at": datetime.now(UTC).isoformat(),
            },
            headers={"Prefer": "return=minimal"},
        )

    def create_signed_preview_url(self, storage_path: str) -> str:
        encoded = quote(storage_path, safe="/")
        payload = self._request(
            "POST",
            f"/storage/v1/object/sign/rag-materials/{encoded}",
            schema=None,
            json={"expiresIn": self.signed_url_ttl_seconds},
        ).json()
        signed = str(payload["signedURL"])
        return signed if signed.startswith("http") else f"{self.url}/storage/v1{signed}"

    def list_scopes(self) -> list[dict[str, Any]]:
        scopes = self._request(
            "GET",
            "/rest/v1/rag_scopes",
            params={
                "select": "id,label,grade_level,is_pilot,subject_id,course_materials!inner(id)",
                "is_active": "eq.true",
                "course_materials.published_status": "eq.published",
                "order": "grade_level.asc,label.asc",
            },
        ).json()
        subject_ids = sorted({scope["subject_id"] for scope in scopes})
        if not subject_ids:
            return []
        subjects = self._request(
            "GET",
            "/rest/v1/subjects",
            schema="public",
            params={"select": "id,code,name", "id": f"in.({','.join(subject_ids)})"},
        ).json()
        by_id = {subject["id"]: subject for subject in subjects}
        for scope in scopes:
            scope["subject"] = by_id.get(scope.pop("subject_id"), {})
            scope.pop("course_materials", None)
        return scopes

    def get_job(self, job_id: str) -> dict[str, Any] | None:
        rows = self._request(
            "GET",
            "/rest/v1/rag_ingestion_jobs",
            params={"select": "*", "id": f"eq.{job_id}", "limit": "1"},
        ).json()
        return rows[0] if rows else None

    def get_citation_page(self, material_id: str, page_number: int) -> dict[str, Any] | None:
        materials = self._request(
            "GET",
            "/rest/v1/course_materials",
            params={
                "select": "id,title,rag_scopes!inner(grade_level,subject_id)",
                "id": f"eq.{material_id}",
                "published_status": "eq.published",
                "limit": "1",
            },
        ).json()
        if not materials:
            return None
        pages = self._request(
            "GET",
            "/rest/v1/material_pages",
            params={
                "select": "page_number,extracted_text,preview_storage_path",
                "material_id": f"eq.{material_id}",
                "page_number": f"eq.{page_number}",
                "limit": "1",
            },
        ).json()
        if not pages:
            return None
        material = materials[0]
        page = pages[0]
        scope = material.get("rag_scopes") or {}
        subjects = self._request(
            "GET",
            "/rest/v1/subjects",
            schema="public",
            params={"select": "code", "id": f"eq.{scope.get('subject_id')}", "limit": "1"},
        ).json()
        subject = subjects[0] if subjects else {}
        return {
            "materialId": material_id,
            "title": material["title"],
            "pageNumber": page_number,
            "excerpt": str(page.get("extracted_text") or "")[:800],
            "gradeLevel": scope.get("grade_level"),
            "subjectCode": subject.get("code"),
            "previewUrl": self.create_signed_preview_url(page["preview_storage_path"]),
            "expiresIn": self.signed_url_ttl_seconds,
        }
