FROM python:3.11-slim AS base

# Security: run as non-root
RUN groupadd -r rawabit && useradd -r -g rawabit -d /app -s /sbin/nologin rawabit

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements-docker.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ app/
COPY db/ db/

# Set ownership
RUN chown -R rawabit:rawabit /app

USER rawabit

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
