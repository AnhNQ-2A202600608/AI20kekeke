# Use standard Python lightweight base image
FROM python:3.11-slim

# Prevent writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV STORAGE_PATH=/app/data

# Setup working directory
WORKDIR /app

# Copy dependency configs
COPY pyproject.toml /app/

# Install backend dependencies
RUN pip install --no-cache-dir .

# Copy application source
COPY src/ /app/src/

# Expose FastAPI default port
EXPOSE 8000

# Run FastAPI app
CMD ["python", "-m", "uvicorn", "src.api.main:create_app", "--host", "0.0.0.0", "--port", "8000", "--factory"]
