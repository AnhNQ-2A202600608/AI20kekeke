import re
from typing import Any


class CitationValidator:
    @staticmethod
    def extract_citations(text: str) -> list[tuple[str, int]]:
        """
        Trích xuất tất cả các citation có dạng [Tên tài liệu, Slide X] từ văn bản.
        Trả về danh sách tuple: (tên_tài_liệu, số_slide)
        """
        # Trích xuất: [Tên tài liệu, Slide X] hoặc [Tên tài liệu, slide X]
        pattern = r"\[([^,\n\]]+),\s*[Ss]lide\s*(\d+)\]"
        matches = re.findall(pattern, text)

        citations = []
        for doc_name, slide_num in matches:
            citations.append((doc_name.strip(), int(slide_num)))
        return citations

    @staticmethod
    def validate_citations(
        text: str,
        retrieved_slides: list[dict[str, Any]],
        query: str = None,
        intent: str = "academic",
    ) -> dict[str, Any]:
        """
        Kiểm tra xem các trích dẫn trong text có thực sự nằm trong danh sách slide được retrieve không.
        Nếu không có trích dẫn nào hợp lệ hoặc RAG không tìm thấy tài liệu, thực hiện fallback an toàn.
        """
        # Nếu đây là câu hỏi xã giao/ngoài lề (intent = "general"), không bắt buộc kiểm tra RAG hay citation
        if intent == "general":
            return {
                "is_valid": True,
                "invalid_citations": [],
                "valid_citations": [],
                "cleaned_text": text,
            }

        # Trường hợp 1: RAG không tìm thấy tài liệu nào liên quan
        if not retrieved_slides:
            is_greeting = False
            if query:
                q_clean = query.lower().strip()
                # Kiểm tra xem có phải là câu chào hỏi đơn giản không
                is_greeting = (
                    any(g in q_clean for g in ["chào", "hi", "hello", "xin chào", "chào bạn"]) and len(q_clean) < 15
                )

            if not is_greeting:
                return {
                    "is_valid": False,
                    "invalid_citations": [],
                    "valid_citations": [],
                    "cleaned_text": "Kiến thức này hiện không nằm trong tài liệu chính thức của khóa học mà tôi có quyền truy cập. Bạn có thể tham khảo thêm tài liệu liên quan hoặc hỏi mentor để được giải đáp.",
                }
            else:
                return {"is_valid": True, "invalid_citations": [], "valid_citations": [], "cleaned_text": text}

        citations = CitationValidator.extract_citations(text)
        # Nếu AI Tutor không chèn trích dẫn nào trong câu trả lời (ví dụ như khi từ chối Socratic, chào hỏi)
        # chúng ta cho phép trả về phản hồi gốc mà không ép fallback
        if not citations:
            return {"is_valid": True, "invalid_citations": [], "valid_citations": [], "cleaned_text": text}

        invalid_citations = []
        valid_citations = []
        cleaned_text = text

        for doc, slide_num in citations:
            # Kiểm tra xem có slide nào khớp trong retrieved_slides không
            is_matched = False
            for slide in retrieved_slides:
                retrieved_doc = slide["document_name"]
                # Chuẩn hóa tên file: bỏ đuôi mở rộng .md hoặc .pdf
                if retrieved_doc.lower().endswith(".md"):
                    clean_retrieved_doc = retrieved_doc[:-3]
                elif retrieved_doc.lower().endswith(".pdf"):
                    clean_retrieved_doc = retrieved_doc[:-4]
                else:
                    clean_retrieved_doc = retrieved_doc
                clean_retrieved_doc = clean_retrieved_doc.strip()

                # So sánh tương đối không phân biệt hoa thường
                doc_normalized = doc.lower().replace(" ", "").replace("_", "").replace("-", "")
                retrieved_normalized = clean_retrieved_doc.lower().replace(" ", "").replace("_", "").replace("-", "")

                if (doc_normalized in retrieved_normalized or retrieved_normalized in doc_normalized) and slide[
                    "slide_number"
                ] == slide_num:
                    is_matched = True
                    break

            if is_matched:
                valid_citations.append((doc, slide_num))
            else:
                invalid_citations.append((doc, slide_num))
                # Loại bỏ trích dẫn sai khỏi text để tránh đưa thông tin sai lệch cho sinh viên
                pattern_to_remove = rf"\[{re.escape(doc)},\s*[Ss]lide\s*{slide_num}\]"
                cleaned_text = re.sub(pattern_to_remove, "", cleaned_text)

        # Làm sạch các khoảng trắng dư thừa sau khi xóa citation
        cleaned_text = re.sub(r"\s+\.", ".", cleaned_text)
        cleaned_text = re.sub(r"\s+,", ",", cleaned_text)

        is_valid = len(invalid_citations) == 0

        # Trường hợp 2: Có trích dẫn nhưng sau khi kiểm tra không còn trích dẫn nào hợp lệ nữa
        if citations and not valid_citations:
            return {
                "is_valid": False,
                "invalid_citations": invalid_citations,
                "valid_citations": [],
                "cleaned_text": "Tôi tìm thấy một số tài liệu học liệu liên quan đến câu hỏi của bạn, tuy nhiên nội dung giải thích chi tiết chưa được tìm thấy chính xác trong tài liệu chính thức của khóa học. Để đảm bảo tính chính xác tuyệt đối, bạn nên tham khảo thêm các tài liệu gốc hoặc liên hệ Mentor để được hướng dẫn chi tiết.",
            }

        # Nếu phát hiện một số citation giả nhưng vẫn còn citation thật, loại bỏ citation giả và thêm ghi chú cảnh báo
        if not is_valid:
            cleaned_text += "\n\n*(Lưu ý: Một số trích dẫn bài giảng tự động bị lược bỏ do không trùng khớp với hệ thống học liệu chính thức).* "

        return {
            "is_valid": is_valid,
            "invalid_citations": invalid_citations,
            "valid_citations": valid_citations,
            "cleaned_text": cleaned_text,
        }
