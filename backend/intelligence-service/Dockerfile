FROM python:3.11-slim
# Use slim for smaller footprint and better security

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install poetry and strictly ensure setuptools is at the top level
# Some OTel versions require pkg_resources which is in setuptools
RUN pip install --no-cache-dir poetry==1.7.1 setuptools==69.0.3

# Copy only requirements to cache them in docker layer
COPY pyproject.toml ./

# Project initialization:
# Do not create virtualenv inside docker container
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Pre-download spaCy model to ensure it's available at runtime
# This prevents race conditions and ModuleNotFoundErrors during startup
RUN python -m spacy download en_core_web_sm

# Copying our application
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
