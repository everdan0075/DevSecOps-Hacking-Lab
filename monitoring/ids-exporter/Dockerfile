FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Expose metrics port
EXPOSE 9200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
    CMD python -c "import requests; requests.get('http://localhost:9200/health', timeout=5)"

# Run the IDS exporter
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9200", "--log-level", "info"]
