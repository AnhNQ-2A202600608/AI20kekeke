from __future__ import annotations

import json
from typing import Protocol

from src.pipeline.graphusion.document_chunker import DocumentChunk
from src.pipeline.graphusion.schemas import LessonExtraction

# 1. System Prompts for SGK and SGV

MATH_SGK_PROMPT = """Bạn là chuyên gia phân tích chương trình Toán lớp 6 (Kết Nối Tri Thức).
Nhiệm vụ: Đọc các đoạn văn bản Markdown (sách giáo khoa - SGK) đã được chunk sẵn dưới đây.
Trích xuất danh sách concept toán học, kỹ năng toán học nguyên tử và các quan hệ giữa chúng.

Quy tắc trích xuất SGK:
1. Đối tượng trích xuất chính:
   - Concepts (Khái niệm, định nghĩa, công thức, tính chất): Đặt concept_type = 'knowledge'.
   - Skills (Thao tác, phương pháp, kỹ năng thực hành, ví dụ mẫu, bài tập): Đặt concept_type = 'skill' hoặc 'subskill'.
2. Nguyên tử hóa (Atomic):
   - Không được tạo các concept quá rộng như "Phân số", "Số nguyên".
   - Hãy chia nhỏ thành các đơn vị cụ thể có thể kiểm tra độc lập bằng 1 câu hỏi, ví dụ: "Nhận biết tử số và mẫu số", "Rút gọn phân số", "Quy đồng mẫu số", "Cộng hai phân số khác mẫu".
3. Loại quan hệ (relation_type):
   - Chỉ được chọn 1 trong các giá trị sau:
     - 'prerequisite_of': Khái niệm/Kỹ năng A cần được hiểu/thực hiện thành thạo trước khi học B.
     - 'causes': Quan hệ nhân quả (sự kiện/điều kiện A dẫn đến kết quả B). Không đưa 'causes' vào prerequisite.
     - 'part_of': Quan hệ thành phần (A là một phần nhỏ của B).
     - 'is_a': Quan hệ phân loại/loại-thể (A là một loại cụ thể của B).
     - 'used_for': Quan hệ ứng dụng/công cụ (A được dùng để tính toán/thực hiện B).
     - 'compared_with': So sánh, đối chiếu trực tiếp giữa A và B.
     - 'related_to': Liên kết chung, không phân cấp rõ ràng.
4. Liên kết nguồn (Provenance) - BẮT BUỘC làm đúng thứ tự sau, sai thứ tự sẽ gây lỗi validate:
   - Bước 1: Chọn câu `evidence` TRƯỚC, phải là nguyên văn (verbatim) một câu/cụm trích thẳng từ NỘI DUNG chunk, không diễn giải/rút gọn/tự viết lại.
   - Bước 2: Chỉ SAU KHI đã chọn evidence, tìm đúng `chunk_id` (giữa các marker `=== START CHUNK: id ===`) có chứa NGUYÊN VĂN câu evidence đó, rồi gán vào `source_chunk_id`/`source_chunk_ids`.
   - Nếu quan hệ nối 2 concept đến từ 2 chunk khác nhau trong bài dài, evidence phải lấy từ chunk chứa concept ĐÍCH (target) của quan hệ, không lấy nhầm từ chunk khác đang đọc dở.
   - Không tự tạo chunk_id mới ngoài danh sách được cung cấp.
5. Không tự tạo UUID database hoặc ID tự sinh. Dùng temporary_id dạng 'c1', 'c2' làm tham chiếu cục bộ trong lesson này."""

MATH_SGV_PROMPT = """Bạn là chuyên gia phân tích phương pháp giảng dạy Toán lớp 6 (Kết Nối Tri Thức).
Nhiệm vụ: Đọc văn bản Markdown (sách giáo viên - SGV) đã được chunk dưới đây.
Trích xuất các mục tiêu dạy học, lầm tưởng/hiểu sai của học sinh và khuyến nghị sư phạm.

Quy tắc trích xuất SGV:
1. Đối tượng trích xuất chính:
   - Learning Objectives (Mục tiêu bài học, năng lực cần đạt): Trích xuất vào mảng `learning_objectives`.
   - Misconceptions (Các sai lầm phổ biến, hiểu lầm đặc trưng, lỗi sai thường gặp khi giải toán): Trích xuất vào mảng `misconceptions` với concept_type = 'misconception'.
   - Recommended Prerequisites (Kiến thức/kỹ năng cần ôn tập trước bài học): Trích xuất quan hệ 'prerequisite_of'.
2. Quan hệ đặc trưng:
   - Dùng relation_type = 'has_misconception' để nối từ Concept/Skill sang Misconception tương ứng.
   - Dùng relation_type = 'addresses_misconception' để nối từ phương pháp giảng dạy/Skill sửa sai sang Misconception.
3. Liên kết nguồn (Provenance):
   - Gắn `source_chunk_id` của misconceptions và relations với chunk_id tương ứng được cung cấp.
   - Đảm bảo evidence được trích xuất trung thực từ sách giáo viên.
4. Dùng temporary_id dạng 'c1', 'm1' làm tham chiếu cục bộ trong lesson này."""

HIST_GEO_SGK_PROMPT = """Bạn là chuyên gia phân tích SGK Lịch sử và Địa lí lớp 6 (Kết Nối Tri Thức).
Nhiệm vụ: Đọc các đoạn văn bản Markdown đã được chunk và trích xuất các sự kiện lịch sử, khái niệm địa lí, kỹ năng bản đồ và quan hệ giữa chúng.

Quy tắc trích xuất Sử-Địa SGK:
1. Đối tượng trích xuất chính:
   - Sự kiện lịch sử, triều đại, nhân vật lịch sử, khái niệm địa lí: Đặt concept_type = 'knowledge'.
   - Kỹ năng thực hành (đọc bản đồ, phân tích biểu đồ, nhận biết tọa độ): Đặt concept_type = 'skill'.
2. Tách biệt Prerequisite và Causes:
   - 'causes': Rất quan trọng trong Sử-Địa. Dùng cho mối quan hệ nguyên nhân - kết quả, sự kiện tiền đề dẫn đến sự kiện lịch sử tiếp theo (Ví dụ: "Chính sách cai trị hà khắc của nhà Hán" -> causes -> "Cuộc khởi nghĩa Hai Bà Trưng").
   - 'prerequisite_of': Chỉ dùng khi kiến thức/kỹ năng A bắt buộc học sinh phải nắm trước khi học khái niệm B (Ví dụ: "Khái niệm kinh độ, vĩ độ" -> prerequisite_of -> "Cách xác định tọa độ địa lí trên bản đồ").
   - KHÔNG đưa quan hệ 'causes' vào prerequisite graph để tránh nhầm lẫn lộ trình học.
3. Liên kết nguồn (Provenance) - BẮT BUỘC làm đúng thứ tự sau, sai thứ tự sẽ gây lỗi validate:
   - Bước 1: Chọn câu `evidence` TRƯỚC, phải là nguyên văn (verbatim) một câu/cụm trích thẳng từ nội dung chunk, không diễn giải/rút gọn/tự viết lại.
   - Bước 2: Chỉ SAU KHI đã chọn evidence, tìm đúng chunk_id (giữa các marker `=== START CHUNK: id ===`) có chứa NGUYÊN VĂN câu evidence đó, rồi gán vào source_chunk_ids/source_chunk_id.
   - Nếu quan hệ nối 2 concept đến từ 2 chunk khác nhau trong bài dài, evidence phải lấy từ chunk chứa concept ĐÍCH (target) của quan hệ, không lấy nhầm từ chunk khác đang đọc dở."""

HIST_GEO_SGV_PROMPT = """Bạn là chuyên gia sư phạm Lịch sử và Địa lí lớp 6.
Nhiệm vụ: Đọc tài liệu Sách giáo viên Sử-Địa dưới đây để trích xuất mục tiêu bài học, năng lực cần đạt, lỗi sai bản đồ/lịch sử thường gặp của học sinh.

Quy tắc trích xuất:
1. Trích xuất mục tiêu dạy học (`learning_objectives`).
2. Trích xuất các lỗi sai/hiểu lầm địa lí/lịch sử phổ biến của học sinh (`misconceptions`), ví dụ: "Nhầm lẫn giữa kinh tuyến và vĩ tuyến".
3. Thiết lập quan hệ 'prerequisite_of', 'has_misconception', 'addresses_misconception'.
4. Đảm bảo mọi bản ghi có bằng chứng evidence và source_chunk_id khớp với văn bản nguồn."""

class KnowledgeExtractor(Protocol):
    def extract(
        self,
        chunks: list[DocumentChunk],
        subject: str,
        source_type: str,
        model: str,
        api_key: str,
        base_url: str | None = None
    ) -> LessonExtraction:
        ...

class OpenAIKnowledgeExtractor:
    def extract(
        self,
        chunks: list[DocumentChunk],
        subject: str,
        source_type: str,
        model: str,
        api_key: str,
        base_url: str | None = None
    ) -> LessonExtraction:
        from openai import OpenAI

        # 1. Determine Prompt based on subject and source_type
        if subject == "math":
            prompt = MATH_SGK_PROMPT if source_type == "SGK" else MATH_SGV_PROMPT
        else:
            prompt = HIST_GEO_SGK_PROMPT if source_type == "SGK" else HIST_GEO_SGV_PROMPT

        # 2. Format input text with clear chunk markers
        input_text_parts = []
        valid_chunk_ids = []
        for chunk in chunks:
            valid_chunk_ids.append(chunk.chunk_id)
            input_text_parts.append(f"=== START CHUNK: {chunk.chunk_id} ===\n{chunk.content}\n=== END CHUNK: {chunk.chunk_id} ===")

        formatted_input = f"Các chunk_id hợp lệ có sẵn là: {', '.join(valid_chunk_ids)}\n\nNội dung văn bản cần trích xuất:\n\n" + "\n\n".join(input_text_parts)

        # 3. Call API
        client = OpenAI(api_key=api_key, base_url=base_url)

        if base_url:
            # JSON Mode fallback for non-OpenAI or older models
            schema_hint = f"\n\nBắt buộc trả về đúng định dạng JSON khớp với JSON Schema của LessonExtraction. Các chunk_id được dùng: {valid_chunk_ids}"
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": prompt + schema_hint},
                    {"role": "user", "content": formatted_input},
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            data = json.loads(response.choices[0].message.content)
            return LessonExtraction.model_validate(data)

        # OpenAI strict parse mode
        response = client.chat.completions.parse(
            model=model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": formatted_input},
            ],
            response_format=LessonExtraction,
            temperature=0.0,
        )
        return response.choices[0].message.parsed

class GroqKnowledgeExtractor:
    def extract(
        self,
        chunks: list[DocumentChunk],
        subject: str,
        source_type: str,
        model: str,
        api_key: str,
        base_url: str | None = None
    ) -> LessonExtraction:
        # Groq uses json_object mode via OpenAI SDK client pointing to Groq endpoint
        # Reuses OpenAIKnowledgeExtractor logic with base_url set
        groq_base_url = base_url or "https://api.groq.com/openai/v1"
        extractor = OpenAIKnowledgeExtractor()
        return extractor.extract(
            chunks=chunks,
            subject=subject,
            source_type=source_type,
            model=model,
            api_key=api_key,
            base_url=groq_base_url
        )
