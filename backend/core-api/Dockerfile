# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git for go mod download
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN GOPROXY=direct go mod download

COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o core-api ./cmd/server

# Run Stage
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/core-api .

EXPOSE 8084

CMD ["./core-api"]
