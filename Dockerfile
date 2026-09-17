# syntax=docker/dockerfile:1
FROM golang:1.21-alpine AS builder

WORKDIR /build
RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /annie main.go

FROM alpine:3.20

RUN apk add --no-cache ca-certificates wget \
    && addgroup -S annie \
    && adduser -S -G annie -h /app annie

WORKDIR /app
COPY --from=builder --chown=annie:annie /annie /app/annie

USER annie
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/app/annie"]
