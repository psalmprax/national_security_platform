#!/bin/bash
set -e

# Directory setup
mkdir -p certs
mkdir -p gateway/certs
mkdir -p cockroach-certs

# 1. Create Root CA
if [ ! -f certs/ca.key ]; then
    echo "Generating Root CA..."
    openssl genrsa -out certs/ca.key 2048
    openssl req -x509 -new -nodes -key certs/ca.key -sha256 -days 3650 -out certs/ca.crt -subj "/CN=National Security Platform Root CA"
else
    echo "Root CA already exists."
fi

# 2. Generate Server Certificate for Gateway/Localhost
# Always generate server.conf for extensions
cat > certs/server.conf <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
CN = localhost

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = core-api
DNS.3 = security-sentinel
DNS.4 = intelligence-service
DNS.5 = vault
DNS.6 = cockroachdb
DNS.7 = gateway
IP.1 = 127.0.0.1
EOF

# 2. Generate Server Certificate for Gateway/Localhost
if [ ! -f gateway/certs/server.key ]; then
    echo "Generating Server Certificate..."
    openssl genrsa -out gateway/certs/server.key 2048
    
    openssl req -new -key gateway/certs/server.key -out certs/server.csr -config certs/server.conf
    openssl x509 -req -in certs/server.csr -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial -out gateway/certs/server.crt -days 365 -sha256 -extfile certs/server.conf -extensions req_ext
    
    # Copy to internal shared certs folder
    cp gateway/certs/server.crt certs/
    cp gateway/certs/server.key certs/
else
    echo "Server Certificate already exists."
fi

# 3. Generate CockroachDB Node Certificate
if [ ! -f cockroach-certs/node.crt ]; then
    echo "Generating CockroachDB Node Certificate..."
    # CockroachDB expects 'node' as CN or specific structure, but for simple setups, standard certs work if mapped correctly.
    # We will reuse the CA for Roach.
    cp certs/ca.crt cockroach-certs/ca.crt
    cp certs/ca.key cockroach-certs/ca.key
    
    openssl genrsa -out cockroach-certs/node.key 2048
    openssl req -new -key cockroach-certs/node.key -out cockroach-certs/node.csr -subj "/CN=node"
    openssl x509 -req -in cockroach-certs/node.csr -CA cockroach-certs/ca.crt -CAkey cockroach-certs/ca.key -CAcreateserial -out cockroach-certs/node.crt -days 365 -sha256 -extfile certs/server.conf -extensions req_ext
    
    # Client Cert (root user)
    openssl genrsa -out cockroach-certs/client.root.key 2048
    openssl req -new -key cockroach-certs/client.root.key -out cockroach-certs/client.root.csr -subj "/CN=root"
    openssl x509 -req -in cockroach-certs/client.root.csr -CA cockroach-certs/ca.crt -CAkey cockroach-certs/ca.key -CAcreateserial -out cockroach-certs/client.root.crt -days 365 -sha256
else
    echo "CockroachDB Certificates already exist."
fi

# 4. Enforce Strict Permissions (CRITICAL for CockroachDB)
echo "Enforcing strict 0600 permissions on all private keys..."
chmod 0600 certs/*.key gateway/certs/*.key cockroach-certs/*.key 2>/dev/null || true

echo "✅ Certificates generated successfully."
ls -l certs/ gateway/certs/ cockroach-certs/
