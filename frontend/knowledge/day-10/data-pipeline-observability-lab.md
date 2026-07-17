# Day 10 - Data Pipeline & Observability: Lab Integration Guide

## 1. Mục Tiêu Bài Thực Hành (Lab Objective)

Mục tiêu của bài thực hành Lab 10 là xây dựng một **AI Ingestion-Transform Pipeline** hoàn chỉnh bằng Python, tích hợp các chốt chặn chất lượng dữ liệu (**Quality Gates**) và cơ chế truy vết nhật ký (**Trace Logging**). Qua bài lab này, học viên sẽ:
1. Hiểu cách thu thập dữ liệu thô, làm sạch, cắt đoạn (chunking) và làm giàu metadata (enrichment).
2. Xây dựng các cổng kiểm soát chất lượng dữ liệu (Quality Gates) để ngăn chặn dữ liệu bẩn xâm nhập vào Vector Database.
3. Mô phỏng các sự cố dữ liệu thực tế (dữ liệu hết hạn, trùng lặp, rò rỉ thông tin PII) để kiểm nghiệm tầm quan trọng của Data Observability.
4. Thực thi truy vết lỗi từ đầu ra của Agent ngược về nguồn tài liệu gốc.

```
[ Mock Sources ] ──> Ingest & Clean ──> [ Quality Gates ] ──> Chunk & Enrich ──> [ Vector DB ]
                            │                  │
                            v                  v
                       PII Redaction     Fail Fast (DLQ)
```

---

## 2. Bước 1: Khởi Tạo Môi Trường & Dữ Liệu Mẫu

### Cài đặt thư viện cần thiết:
```bash
pip install numpy pydantic
```

Chúng ta sẽ tạo một file Python `pipeline_lab.py`. Bắt đầu bằng việc định nghĩa các schemas cho dữ liệu nguồn và cấu trúc tài liệu lưu trữ sử dụng thư viện `pydantic`:

```python
import hashlib
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Schema cho tài liệu thô tại nguồn
class RawDocument(BaseModel):
    doc_id: str
    title: str
    content: str
    effective_date: str  # Định dạng YYYY-MM-DD
    department: str
    version: str

# Schema cho chunk dữ liệu sau khi biến đổi
class ProcessedChunk(BaseModel):
    chunk_id: str
    doc_id: str
    content: str
    metadata: Dict[str, Any]
    hash: str
```

### Chuẩn bị dữ liệu thô tại nguồn (Raw Documents):
```python
raw_database = [
    RawDocument(
        doc_id="doc_refund_2025",
        title="Chính sách hoàn tiền 2025",
        content="Khách hàng được hoàn trả sản phẩm trong vòng 30 ngày kể từ ngày mua. Yêu cầu sản phẩm còn nguyên hộp và có hóa đơn mua hàng.",
        effective_date="2025-01-01",
        department="customer_support",
        version="v1.0"
    ),
    RawDocument(
        doc_id="doc_refund_2026",
        title="Chính sách hoàn tiền 2026 (Mới nhất)",
        content="Cập nhật chính sách mới: Thời hạn hoàn tiền được rút ngắn xuống còn 15 ngày để tối ưu hóa quy trình kho bãi. Áp dụng cho mọi sản phẩm mua từ năm 2026.",
        effective_date="2026-01-01",
        department="customer_support",
        version="v2.0"
    ),
    RawDocument(
        doc_id="doc_api_keys",
        title="Thông tin cấu hình hệ thống",
        content="Để kết nối vào sandbox môi trường test, sử dụng API KEY: sk-prod-xyz123456789. Mật khẩu admin mặc định là admin123.",
        effective_date="2026-02-01",
        department="it_engineering",
        version="v1.0"
    )
]
```

---

## 3. Bước 2: Xây Dựng Bộ Lọc Chất Lượng (Quality Gates)

Chúng ta sẽ triển khai một lớp `DataQualityGate` chịu trách nhiệm chặn các dòng dữ liệu không hợp lệ. Lớp này sẽ thực hiện 4 nhiệm vụ kiểm tra:
1. **Schema Check:** Kiểm tra các trường bắt buộc không được để trống hoặc Null.
2. **Freshness Check:** Cảnh báo hoặc loại bỏ các văn bản chính sách đã quá cũ (ví dụ: trước năm 2026).
3. **PII/Secrets Redaction:** Phát hiện và che giấu các khóa bảo mật (API keys, mật khẩu).
4. **Uniqueness Check:** Đảm bảo không nạp trùng lặp nội dung.

```python
class DataQualityGate:
    def __init__(self, cut_off_date: str = "2026-01-01"):
        self.cut_off_date = datetime.strptime(cut_off_date, "%Y-%m-%d")
        self.seen_hashes = set()

    def clean_and_redact_secrets(self, text: str) -> str:
        # Regex phát hiện API Key dạng sk-...
        api_key_pattern = r"(sk-[a-zA-Z0-9-]{12,})"
        # Regex phát hiện mật khẩu ghi thô
        password_pattern = r"(mật khẩu mặc định là|password is)\s+([a-zA-Z0-9_!@#\$%\^&\*]+)"
        
        cleaned_text = text
        cleaned_text = re.sub(api_key_pattern, "[REDACTED_API_KEY]", cleaned_text)
        cleaned_text = re.sub(password_pattern, r"\1 [REDACTED_PASSWORD]", cleaned_text)
        return cleaned_text

    def validate(self, doc: RawDocument) -> bool:
        # 1. Schema Check
        if not doc.doc_id or not doc.content.strip():
            print(f"  [Quality Gate - FAIL] {doc.doc_id}: Nội dung trống.")
            return False
            
        # 2. Freshness Check
        doc_date = datetime.strptime(doc.effective_date, "%Y-%m-%d")
        if doc_date < self.cut_off_date:
            print(f"  [Quality Gate - REJECT] {doc.doc_id}: Tài liệu quá cũ ({doc.effective_date} < {self.cut_off_date.date()}).")
            return False
            
        # 3. Check & Redact secrets
        original_content = doc.content
        doc.content = self.clean_and_redact_secrets(doc.content)
        if original_content != doc.content:
            print(f"  [Quality Gate - WARN] {doc.doc_id}: Đã phát hiện và che giấu thông tin nhạy cảm (PII/Secrets).")
            
        # 4. Uniqueness Check (Chống trùng lặp tại mức tài liệu thô)
        content_hash = hashlib.sha256(doc.content.encode('utf-8')).hexdigest()
        if content_hash in self.seen_hashes:
            print(f"  [Quality Gate - REJECT] {doc.doc_id}: Phát hiện nội dung trùng lặp.")
            return False
            
        self.seen_hashes.add(content_hash)
        return True
```

---

## 4. Bước 3: Xây Dựng Ingestion-Transform Pipeline

Pipeline sẽ duyệt qua danh sách tài liệu thô, đẩy qua `DataQualityGate`. Nếu tài liệu hợp lệ, tiến hành cắt nhỏ (chunking) và làm giàu metadata rồi lưu trữ.

```python
class DataPipeline:
    def __init__(self, quality_gate: DataQualityGate):
        self.quality_gate = quality_gate
        self.processed_chunks: List[ProcessedChunk] = []
        self.pipeline_run_id = f"run-{int(datetime.now().timestamp())}"

    def chunk_document(self, doc: RawDocument, chunk_size: int = 60) -> List[ProcessedChunk]:
        """Cắt tài liệu thành các chunks từ ngữ và đính kèm metadata phong phú."""
        words = doc.content.split()
        chunks = []
        
        # Cắt thô theo số lượng từ
        for i in range(0, len(words), chunk_size):
            chunk_words = words[i:i + chunk_size]
            chunk_content = " ".join(chunk_words)
            chunk_hash = hashlib.sha256(chunk_content.encode('utf-8')).hexdigest()
            chunk_id = f"{doc.doc_id}_chunk_{len(chunks)}"
            
            # Làm giàu metadata
            metadata = {
                "source_doc_id": doc.doc_id,
                "title": doc.title,
                "effective_date": doc.effective_date,
                "department": doc.department,
                "version": doc.version,
                "pipeline_run_id": self.pipeline_run_id
            }
            
            chunks.append(
                ProcessedChunk(
                    chunk_id=chunk_id,
                    doc_id=doc.doc_id,
                    content=chunk_content,
                    metadata=metadata,
                    hash=chunk_hash
                )
            )
        return chunks

    def run(self, raw_docs: List[RawDocument]) -> List[ProcessedChunk]:
        print(f"\n--- [Pipeline Run Started - ID: {self.pipeline_run_id}] ---")
        for doc in raw_docs:
            print(f"Đang xử lý tài liệu: {doc.doc_id}...")
            
            # Đẩy qua chốt chặn chất lượng (Quality Gate)
            if self.quality_gate.validate(doc):
                # Biến đổi (Transform & Chunking)
                doc_chunks = self.chunk_document(doc)
                self.processed_chunks.extend(doc_chunks)
                print(f"  [Success] Tài liệu hợp lệ. Đã tạo {len(doc_chunks)} chunks.")
            else:
                print(f"  [Failure] Tài liệu bị từ chối bởi Quality Gate.")
                
        print(f"--- [Pipeline Run Completed. Tổng số chunk hợp lệ: {len(self.processed_chunks)}] ---\n")
        return self.processed_chunks
```

---

## 5. Bước 4: Xây Dựng Mock Vector Store & Retrieval Service

Để kiểm tra chất lượng tìm kiếm, chúng ta xây dựng một Mock Vector Database đơn giản. Lớp này hỗ trợ tìm kiếm từ khóa (Keyword Search) trên tập hợp các chunk đã xử lý và ghi nhận nhật ký hoạt động (Trace Logs).

```python
class MockVectorStore:
    def __init__(self):
        self.chunks_db: Dict[str, ProcessedChunk] = {}

    def upsert_chunks(self, chunks: List[ProcessedChunk]):
        for chunk in chunks:
            self.chunks_db[chunk.chunk_id] = chunk

    def retrieve(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        # Tìm kiếm thô dựa trên mức độ xuất hiện từ khóa trong chunk
        query_words = set(query.lower().split())
        scored_chunks = []
        
        for chunk_id, chunk in self.chunks_db.items():
            content_words = chunk.content.lower().split()
            # Tính điểm tương đồng thô
            match_score = len(query_words.intersection(content_words)) / len(query_words)
            if match_score > 0:
                scored_chunks.append((chunk, match_score))
                
        # Sắp xếp theo điểm số giảm dần
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        results = []
        
        for chunk, score in scored_chunks[:top_k]:
            results.append({
                "chunk_id": chunk.chunk_id,
                "content": chunk.content,
                "score": score,
                "metadata": chunk.metadata
            })
        return results
```

---

## 6. Bước 5: Viết Hàm Xử Lý Trace Logs và Debug

Lớp `AgentService` đóng vai trò là nơi Agent nhận câu hỏi từ khách hàng, gọi Vector Store để lấy ngữ cảnh và trả về câu trả lời hoàn chỉnh kèm thông tin trace log chi tiết để hỗ trợ việc debug.

```python
class AgentService:
    def __init__(self, vector_store: MockVectorStore):
        self.vector_store = vector_store

    def ask_agent(self, query: str) -> Dict[str, Any]:
        # 1. Truy xuất ngữ cảnh
        retrieved_contexts = self.vector_store.retrieve(query, top_k=2)
        
        # 2. Sinh câu trả lời giả lập dựa trên contexts
        if not retrieved_contexts:
            final_answer = "Xin lỗi, tôi không tìm thấy tài liệu chính sách liên quan để trả lời."
        else:
            best_match = retrieved_contexts[0]
            final_answer = f"Theo quy định tại '{best_match['metadata']['title']}' (Cập nhật ngày {best_match['metadata']['effective_date']}): {best_match['content']}"
            
        # 3. Ghi nhận Trace Log
        trace_log = {
            "query": query,
            "answer": final_answer,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "retrieved_chunks": [
                {
                    "chunk_id": c["chunk_id"],
                    "score": round(c["score"], 3),
                    "pipeline_run_id": c["metadata"]["pipeline_run_id"],
                    "source_version": c["metadata"]["version"]
                }
                for c in retrieved_contexts
            ]
        }
        
        return {
            "answer": final_answer,
            "trace_log": trace_log
        }
```

---

## 7. Bước 6: Kiểm Nghiệm Thực Tế (Execution Test)

Hãy chạy thử chương trình trong 2 kịch bản:
- **Kịch bản A (Không có Quality Gate):** Nạp toàn bộ dữ liệu bẩn và lỗi thời trực tiếp vào Database.
- **Kịch bản B (Kích hoạt Quality Gate):** Lọc sạch dữ liệu trước khi nạp và kiểm tra kết quả truy xuất của Agent.

```python
def main():
    print("==================================================")
    print("KỊCH BẢN B: KÍCH HOẠT QUALITY GATES & OBSERVABILITY")
    print("==================================================")
    
    # Khởi tạo Pipeline có Quality Gates chặn dữ liệu trước 2026
    quality_gate = DataQualityGate(cut_off_date="2026-01-01")
    pipeline = DataPipeline(quality_gate=quality_gate)
    vector_store = MockVectorStore()
    
    # Chạy pipeline trên dữ liệu thô
    valid_chunks = pipeline.run(raw_database)
    vector_store.upsert_chunks(valid_chunks)
    
    # Khởi tạo Agent Service
    agent = AgentService(vector_store=vector_store)
    
    # Câu hỏi 1: Về chính sách hoàn tiền mới
    print("\n--- [TEST 1: Hỏi về chính sách hoàn tiền] ---")
    res1 = agent.ask_agent("Chính sách hoàn tiền mới là bao nhiêu ngày?")
    print(f"Câu trả lời của Agent:\n> {res1['answer']}")
    print(f"Nhật ký truy vết (Trace Log):\n{res1['trace_log']}\n")
    # KẾT QUẢ MONG ĐỢI: Agent phải lấy được văn bản năm 2026 (15 ngày),
    # và bỏ qua văn bản năm 2025 (30 ngày) vì đã bị Quality Gate chặn do quá hạn.
    
    # Câu hỏi 2: Hỏi về thông tin nhạy cảm
    print("\n--- [TEST 2: Hỏi về mật khẩu và API key] ---")
    res2 = agent.ask_agent("Lấy API KEY sandbox và mật khẩu mặc định")
    print(f"Câu trả lời của Agent:\n> {res2['answer']}")
    print(f"Nhật ký truy vết (Trace Log):\n{res2['trace_log']}")
    # KẾT QUẢ MONG ĐỢI: Dữ liệu nhạy cảm phải hiển thị dạng [REDACTED_API_KEY]
    # và [REDACTED_PASSWORD], không bị lộ thông tin mật khẩu thô của hệ thống.

if __name__ == "__main__":
    main()
```

### Chạy chương trình và kiểm tra Output:
Hãy copy toàn bộ code trên và chạy thử. Dữ liệu lỗi thời năm 2025 (`doc_refund_2025`) sẽ bị chặn hoàn toàn tại cửa ngõ kiểm soát. Khi người dùng hỏi về thời hạn hoàn tiền, Agent sẽ tìm thấy duy nhất chunk năm 2026 và trả lời chính xác: **"15 ngày"** (thay vì trả lời sai lệch **"30 ngày"** nếu nạp cả file cũ). Các thông tin nhạy cảm IT cũng được thay thế hoàn toàn bằng chuỗi che giấu bảo mật.

---

## 8. Checklist Nộp Bài Lab 10 (Deliverables Rubric)

Để đạt điểm xuất sắc cho Lab 10, học viên cần nộp các thành phần:

- [ ] **Mã nguồn hoàn chỉnh (`pipeline_lab.py`):** Triển khai đầy đủ Ingestion, Transform (Chunking + Metadata) và Quality Gates.
- [ ] **Hiện thực hóa 4 Quality Gates:**
  - *Schema check:* Không cho phép rỗng/thiếu ID.
  - *Freshness check:* So sánh ngày tháng và từ chối các file lỗi thời.
  - *Secrets check:* Phát hiện và ẩn danh PII/API Keys.
  - *Uniqueness check:* Đảm bảo không trùng lặp (lưu hash).
- [ ] **Trace Logs xuất sắc:** Nhật ký truy vết ghi lại đầy đủ thông tin: ID câu hỏi, danh sách các chunk đã truy xuất, độ khớp điểm số (relevance score), `pipeline_run_id` và phiên bản tài liệu.
- [ ] **Báo cáo phân tích so sánh:** So sánh phản hồi của Agent khi có và khi không có Quality Gates (chứng minh việc dữ liệu bẩn làm Agent trả lời sai hoặc rò rỉ dữ liệu).
