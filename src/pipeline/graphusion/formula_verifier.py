"""Xác thực tự động công thức toán trích xuất từ vision-LLM bằng SymPy
back-substitution.

Lý do tồn tại module này: test thực tế trên SGV Toán 8 KNTT (bài 7.16) cho
thấy GPT-4o có thể âm thầm transcribe sai một phương trình (đổi
"x/25 + 2 = (x+8)/24" thành "x/25 + (x+8)/24 = 100") trong khi vẫn giữ đáp số
đúng ở dòng sau - lỗi rất khó phát hiện bằng mắt thường. Xem
docs/domain-knowledge/PDF_to_Knowledge_Graph.md mục 2.2 và 3.1.

Cơ chế: với mọi trang lời giải có dạng (phương trình, biến, đáp số), thay đáp
số ngược lại vào phương trình bằng SymPy, kiểm tra vế trái = vế phải. Không
cần gọi thêm LLM để "chấm lại" - chỉ cần structured extraction đúng schema.
"""

from pydantic import BaseModel, Field
from sympy import simplify, symbols, sympify
from sympy.core.sympify import SympifyError


class WorkedFormula(BaseModel):
    """Một phương trình lời giải trích xuất được từ 1 trang, kèm đáp số công bố."""

    page: int = Field(description="Số trang nguồn (từ marker <!-- page: N -->)")
    variable: str = Field(default="x", description="Tên biến chính trong phương trình")
    lhs: str = Field(description="Vế trái phương trình, cú pháp SymPy-parseable (vd: 'x/25 + 2')")
    rhs: str = Field(description="Vế phải phương trình, cú pháp SymPy-parseable (vd: '(x + 8)/24')")
    answer: str = Field(description="Đáp số công bố cho biến, dạng số hoặc biểu thức SymPy-parseable")


class VerificationResult(BaseModel):
    page: int
    status: str  # "pass" | "fail" | "unparseable"
    lhs_value: str | None = None
    rhs_value: str | None = None
    detail: str | None = None


def verify_formula(formula: WorkedFormula) -> VerificationResult:
    """Thay đáp số vào phương trình, kiểm tra vế trái = vế phải.

    status:
    - "pass"        : vế trái == vế phải sau khi thay đáp số -> an toàn để publish.
    - "fail"         : vế trái != vế phải -> KHÔNG publish, gắn needs_manual_review.
    - "unparseable" : không parse được lhs/rhs/answer bằng SymPy -> qua review thường
                      (không tự động kết luận đúng/sai).
    """
    try:
        var = symbols(formula.variable)
        lhs_expr = sympify(formula.lhs)
        rhs_expr = sympify(formula.rhs)
        answer_expr = sympify(formula.answer)
    except (SympifyError, TypeError, ValueError) as e:
        return VerificationResult(page=formula.page, status="unparseable", detail=str(e))

    try:
        lhs_value = lhs_expr.subs(var, answer_expr)
        rhs_value = rhs_expr.subs(var, answer_expr)
        is_equal = simplify(lhs_value - rhs_value) == 0
    except Exception as e:
        return VerificationResult(page=formula.page, status="unparseable", detail=str(e))

    return VerificationResult(
        page=formula.page,
        status="pass" if is_equal else "fail",
        lhs_value=str(lhs_value),
        rhs_value=str(rhs_value),
        detail=None if is_equal else "Vế trái và vế phải không khớp khi thay đáp số - nghi ngờ lỗi transcription.",
    )


def verify_all(formulas: list[WorkedFormula]) -> list[VerificationResult]:
    return [verify_formula(f) for f in formulas]
