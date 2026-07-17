# ---- Stage 1: Builder ----
FROM python:3.11-slim AS builder

WORKDIR /app
ENV PATH="/opt/venv/bin:$PATH"

# Cài uv — công cụ giải quyết dependency nhanh bằng Rust
RUN pip install uv --no-cache-dir

# Tạo virtual environment độc lập
RUN python -m venv /opt/venv

# Copy metadata trước, copy code sau → tối ưu Docker layer cache:
# Nếu chỉ sửa code (không thêm package), layer này được cache lại.
COPY pyproject.toml .
RUN uv pip install -e . --no-cache

# ---- Stage 2: Production Runner ----
FROM python:3.11-slim

WORKDIR /app

# Copy virtual environment đã cài sẵn, bỏ qua toàn bộ build tools
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV STORAGE_PATH=/app/data

# Bảo mật: chạy container bằng user phi root
RUN useradd -m appuser
RUN mkdir -p /app/data && chown -R appuser:appuser /app

COPY src/ /app/src/
RUN chown -R appuser:appuser /app/src

USER appuser

EXPOSE 8000

# Healthcheck dùng đường dẫn thực tế của dự án: /api/v1/health
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["python", "-m", "uvicorn", "src.api.main:create_app", "--host", "0.0.0.0", "--port", "8000", "--factory"]
