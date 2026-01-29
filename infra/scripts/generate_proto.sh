#!/bin/bash

# This script generates Go and Python code from the .proto definitions.
# It uses a Docker container so you don't need to install protoc locally.

echo "Generating Protobuf Code..."

# Get absolute path to the project root
PROJECT_ROOT=$(pwd)

# Verify we are in the root
if [ ! -d "$PROJECT_ROOT/platform/proto" ]; then
  echo "Error: Please run this script from the project root."
  echo "Usage: ./infra/scripts/generate_proto.sh"
  exit 1
fi

docker run --rm \
  -v "$PROJECT_ROOT:/workspace" \
  -w /workspace \
  rvolosatovs/protoc:4.0.0 \
  --proto_path=platform/proto \
  --go_out=backend/core-api/pkg \
  --go_opt=paths=source_relative \
  --go-grpc_out=backend/core-api/pkg \
  --go-grpc_opt=paths=source_relative \
  --python_out=backend/intelligence-service/backend \
  --grpc-python_out=backend/intelligence-service/backend \
  national_security.proto

echo "✅ Code generation complete!"
echo "   - Go: backend/core-api/pkg/proto/national_security.pb.go"
echo "   - Python: backend/intelligence-service/backend/national_security_pb2.py"
