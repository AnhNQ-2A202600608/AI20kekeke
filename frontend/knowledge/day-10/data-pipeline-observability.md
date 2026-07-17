# Data Pipeline Observability — Giám sát & Gỡ lỗi Dữ liệu cho AI Agent

## 1. Mối Liên Hệ Giữa Sức Khỏe Dữ Liệu và Độ Tin Cậy của LLM

Trong các hệ thống RAG (Retrieval-Augmented Generation) và AI Agent, chúng ta thường tập trung tối ưu hóa các tham số của LLM hoặc chiến lược lập prompt. Tuy nhiên, hiệu năng thực tế của mô hình bị giới hạn bởi chất lượng dữ liệu đầu vào. Hiện tượng **"Garbage In, Hallucination Out"** chỉ ra rằng: nếu Vector Database bị nạp dữ liệu bẩn, lỗi thời hoặc trùng lặp, Agent chắc chắn sẽ đưa ra câu trả lời sai lệch bất kể mô hình LLM có thông minh đến đâu.

Do đó, **Data Observability (Giám sát dữ liệu)** là chìa khóa để phát hiện sớm các sự cố dữ liệu trước khi chúng ảnh hưởng đến trải nghiệm người dùng cuối.

---

## 2. 5 Trụ Cột của Data Observability cho Hệ Thống AI

Giám sát dữ liệu cho hệ thống AI không chỉ dừng lại ở việc kiểm tra server có hoạt động (uptime/downtime) mà tập trung vào 5 khía cạnh dữ liệu cốt lõi:

```
                      ┌──────────────────────┐
                      │  DATA OBSERVABILITY  │
                      └──────────┬───────────┘
     ┌──────────────┬────────────┼─────────────┬──────────────┐
     v              v            v             v              v
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Freshness │  │  Volume  │  │  Schema  │  │Distribu─ │  │ Lineage  │
│          │  │          │  │  Drift   │  │  tion    │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

1. **Freshness (Độ tươi mới):**
   - *Định nghĩa:* Tần suất cập nhật dữ liệu và tuổi thọ tối đa của bản ghi trong cơ sở dữ liệu.
   - *Ảnh hưởng AI:* Nếu pipeline đồng bộ chính sách bị chậm trễ, Agent sẽ tiếp tục sử dụng chính sách hoàn tiền cũ của tháng trước để trả lời khách hàng.
   - *Metric:* Khoảng thời gian từ lần cập nhật cuối đến hiện tại (latency_ms), SLA hoàn thành pipeline.
2. **Volume (Thể tích/Số lượng):**
   - *Định nghĩa:* Số lượng bản ghi dữ liệu được thêm mới, cập nhật hoặc xóa đi trong mỗi lần chạy pipeline.
   - *Ảnh hưởng AI:* Nếu số lượng chunk được embedding hôm nay đột ngột giảm về 0, điều này báo hiệu nguồn dữ liệu (ví dụ: API Notion) đang bị lỗi phân quyền hoặc kết nối.
   - *Metric:* Số lượng bản ghi thêm mới (row_count_delta), tỷ lệ biến động số dòng.
3. **Schema (Cấu trúc dữ liệu):**
   - *Định nghĩa:* Giám sát sự thay đổi về kiểu dữ liệu, tên trường hoặc cấu trúc bảng của dữ liệu nguồn.
   - *Ảnh hưởng AI:* Nếu tài liệu nguồn bị đổi tên trường từ `content` thành `text` mà code pipeline chưa cập nhật, Vector Store sẽ bị nạp các chunk rỗng.
   - *Metric:* Tự động phát hiện schema drift (mất trường, đổi kiểu dữ liệu).
4. **Distribution (Sự phân phối giá trị):**
   - *Định nghĩa:* Sự phân bố của các giá trị trong một trường dữ liệu (ví dụ: tỷ lệ giá trị null, độ dài ký tự tối thiểu).
   - *Ảnh hưởng AI:* Nếu tỷ lệ null ở trường metadata `source_url` tăng đột biến, Agent sẽ không thể trích dẫn nguồn (citation) chính xác cho người dùng.
   - *Metric:* Tỷ lệ trống (null_rate_per_column), phân phối độ dài văn bản (text_length_distribution).
5. **Lineage (Phả hệ dữ liệu):**
   - *Định nghĩa:* Bản đồ chi tiết ghi nhận đường đi của dữ liệu từ nguồn gốc (source file), qua các bước xử lý (cleaning, chunking), lưu trữ (vector store) cho đến khi được truy xuất làm ngữ cảnh của Agent.
   - *Ảnh hưởng AI:* Khi Agent trả lời sai, lineage giúp lập trình viên tìm nhanh ra tài liệu gốc nào đã gây ra lỗi.

---

## 3. Quy Trình 5 Lớp Gỡ Lỗi (Debugging Flow)

Khi phát hiện Agent đưa ra câu trả lời sai lệch hoặc bịa đặt thông tin, quy trình gỡ lỗi bắt buộc phải đi ngược từ ngoài vào trong theo **5 lớp hệ thống**:

```
[ LỚP 1: OUTPUT ] ──> Kiểm tra câu trả lời, citation và độ tin cậy (confidence score)
        │
        v
[ LỚP 2: RETRIEVAL ] ──> Kiểm tra top-k chunks lấy ra từ Vector DB có liên quan không?
        │
        v
[ LỚP 3: INDEX ] ──> Kiểm tra embeddings model version và ID của chunk trong DB
        │
        v
[ LỚP 4: PIPELINE ] ──> Kiểm tra nhật ký chạy (run ID), các quality gates đã vượt qua
        │
        v
[ LỚP 5: SOURCE ] ──> Kiểm tra file gốc (PDF, Notion) có đúng, mới và đầy đủ không?
```

### Chi tiết hành động tại từng lớp:

- **Lớp 1 (Output Layer):** Đánh giá xem câu trả lời có bịa đặt so với ngữ cảnh đi kèm (faithfulness) hay không. Xem Agent trích dẫn nguồn có đúng định dạng không.
- **Lớp 2 (Retrieval Layer):** Kiểm tra xem các chunk được truy xuất có chứa câu trả lời đúng cho câu hỏi hay không. Nếu không có chunk nào chứa thông tin đúng (zero-hit), lỗi nằm ở hệ thống tìm kiếm (RAG retrieval) hoặc dữ liệu chưa được nạp.
- **Lớp 3 (Index Layer):** Xác định mô hình embedding đang sử dụng có đồng bộ giữa lúc ghi và lúc đọc không. Kiểm tra xem các chunk trong DB có bị trùng lặp làm loãng kết quả search không.
- **Lớp 4 (Pipeline Layer):** Xem lại lịch sử chạy của pipeline. Xác định xem phiên chạy nạp tài liệu đó có gặp lỗi mạng, bị ngắt giữa chừng hay bị loại bỏ bởi Quality Gate nào không.
- **Lớp 5 (Source Layer):** Mở tài liệu gốc tại nguồn. Xác minh xem văn bản gốc có bị viết sai chính tả, lỗi định dạng font chữ khiến OCR đọc sai, hoặc tài liệu đã quá hạn hiệu lực mà chưa được gỡ bỏ không.

---

## 4. Thiết Kế Schema Nhật Ký Truy Vết (Trace Log Contract)

Để hỗ trợ quy trình gỡ lỗi 5 lớp nêu trên, hệ thống RAG/Agent cần ghi nhận chi tiết trace log cho mỗi yêu cầu của người dùng. Dưới đây là cấu trúc log hợp đồng khuyến nghị:

```json
{
  "request_id": "req-9876543210-abcde",
  "timestamp": "2026-06-10T14:20:05Z",
  "query": "Chính sách bảo hành sản phẩm mua trong đợt khuyến mãi là gì?",
  "agent_decision": {
    "intent": "policy_query",
    "need_retrieval": true,
    "confidence_score": 0.92
  },
  "retrieved_context": [
    {
      "chunk_id": "doc_warranty_001_chunk_3",
      "score": 0.845,
      "text": "Chính sách bảo hành 1 đổi 1 áp dụng cho mọi sản phẩm, ngoại trừ hàng thanh lý hoặc hàng mua trong chương trình xả kho giảm giá trên 50% [Nguồn: warranty_policy_2026.pdf].",
      "source_doc_id": "doc_warranty_001",
      "source_version": "v2.1 (2026-01-15)",
      "pipeline_run_id": "run-20260610-020000"
    }
  ],
  "generation_metrics": {
    "model": "gpt-4o-mini",
    "prompt_tokens": 1250,
    "completion_tokens": 180,
    "latency_ms": 1250
  },
  "final_answer": "Đối với các sản phẩm mua trong đợt khuyến mãi, chính sách bảo hành 1 đổi 1 vẫn được áp dụng bình thường. Tuy nhiên, ngoại lệ áp dụng cho các sản phẩm thuộc danh mục thanh lý hoặc hàng mua trong chương trình xả kho giảm giá trên 50% sẽ không được hỗ trợ đổi trả [1].",
  "citations": [
    {
      "ref_num": 1,
      "source": "warranty_policy_2026.pdf",
      "version": "v2.1 (2026-01-15)"
    }
  ]
}
```

---

## 5. Hiện Tượng "Silently Failed" và Cách Phòng Tránh

Trong kỹ thuật phần mềm truyền thống, khi hệ thống gặp lỗi (ví dụ: mất kết nối DB), mã lỗi 500 sẽ được trả về và hệ thống dừng hoạt động (Fail Loudly). 

Tuy nhiên, trong hệ thống AI, lỗi dữ liệu thường diễn ra **trong âm thầm (Silently Failed)**:
- Ingestion fail → Agent vẫn trả lời bình thường, nhưng dùng tài liệu cũ đã hết hạn.
- Chunking cắt ngang câu chứa điều kiện loại trừ → Agent trả lời khẳng định thay vì phủ định.
- PII Leakage → Agent vô tình đọc được mật khẩu trong log thô và trả lời cho user khác.

### Các biện pháp phòng tránh:
1. **Enforce Strict Quality Gates:** Sử dụng các thư viện như `Pydantic` hoặc `Great Expectations` để validate chặt chẽ schema của dữ liệu trước khi sinh embeddings.
2. **Kích hoạt Smoke Test tự động:** Sau khi pipeline nạp dữ liệu hoàn thành, tự động chạy một bộ câu hỏi chuẩn (Gold Dataset) để kiểm tra xem hệ thống RAG có retrieve đúng chunk mong đợi hay không.
3. **Giám sát tỷ lệ trích dẫn (Citation Rate):** Nếu tỷ lệ câu trả lời không kèm citation tăng đột biến, điều này phản ánh hệ thống RAG đang không tìm thấy thông tin phù hợp và Agent đang phải tự suy luận (hallucinate).
