# Backend Dockerfile - Multi-stage build för API och Collector
FROM python:3.11-slim as base

WORKDIR /app

# Set PYTHONPATH for correct module imports
ENV PYTHONPATH=/app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# API Service
FROM base as api
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Collector Service
FROM base as collector
CMD ["python", "collector/main.py"]
