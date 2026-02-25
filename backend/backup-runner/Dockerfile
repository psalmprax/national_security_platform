FROM ubuntu:22.04

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    cron \
    tar \
    gzip \
    && rm -rf /var/lib/apt/lists/*

# Install CockroachDB CLI
RUN wget -qO- https://binaries.cockroachdb.com/cockroach-v23.1.10.linux-amd64.tgz | tar xvz && \
    cp -i cockroach-v23.1.10.linux-amd64/cockroach /usr/local/bin/ && \
    rm -rf cockroach-v23.1.10.linux-amd64

# Install MinIO Client (mc)
RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc && \
    chmod +x mc && \
    mv mc /usr/local/bin/

# Set workdir
WORKDIR /app

# Copy scripts and crontab
COPY scripts /app/scripts
RUN chmod +x /app/scripts/*.sh

# Run the runner script
ENTRYPOINT ["/app/scripts/backup_runner.sh"]
