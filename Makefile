.PHONY: help build run test clean docker-build docker-push deploy deploy-azure

help:
	@echo "Annie - Go Backend"
	@echo "=================="
	@echo ""
	@echo "Available targets:"
	@echo "  build              - Build the Go application"
	@echo "  run                - Run the application locally"
	@echo "  test               - Run tests"
	@echo "  test-verbose       - Run tests with verbose output"
	@echo "  lint               - Run linters (if installed)"
	@echo "  fmt                - Format code"
	@echo "  clean              - Clean build artifacts"
	@echo "  docker-build       - Build Docker image"
	@echo "  docker-run         - Run Docker container locally"
	@echo "  docker-push        - Push image to registry (requires ACR_LOGIN_SERVER env var)"
	@echo "  deploy-dev         - Deploy to Azure dev environment"
	@echo "  deploy-staging     - Deploy to Azure staging environment"
	@echo "  deploy-prod        - Deploy to Azure production environment"
	@echo "  logs               - View Azure App Service logs"
	@echo "  health             - Check application health"

build:
	@echo "Building Annie..."
	go build -o annie main.go
	@echo "✓ Build complete"

run: build
	@echo "Running Annie on http://localhost:8080"
	./annie

dev:
	@echo "Running Annie in development mode..."
	go run main.go

test:
	@echo "Running tests..."
	go test ./...

test-verbose:
	@echo "Running tests (verbose)..."
	go test -v ./...

coverage:
	@echo "Running tests with coverage..."
	go test -cover ./...
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

lint:
	@echo "Running golangci-lint..."
	golangci-lint run ./...

fmt:
	@echo "Formatting code..."
	go fmt ./...
	@echo "✓ Code formatted"

clean:
	@echo "Cleaning build artifacts..."
	rm -f annie
	rm -f coverage.out
	go clean
	@echo "✓ Clean complete"

docker-build:
	@echo "Building Docker image..."
	docker build -t annie:latest .
	@echo "✓ Docker image built"

docker-run: docker-build
	@echo "Running Docker container on http://localhost:8080"
	docker run -p 8080:8080 \
		-e ENVIRONMENT=development \
		-e LOG_LEVEL=debug \
		annie:latest

docker-push:
	@if [ -z "$(ACR_LOGIN_SERVER)" ]; then \
		echo "Error: ACR_LOGIN_SERVER not set"; \
		exit 1; \
	fi
	@echo "Tagging image for $(ACR_LOGIN_SERVER)..."
	docker tag annie:latest $(ACR_LOGIN_SERVER)/annie:latest
	docker tag annie:latest $(ACR_LOGIN_SERVER)/annie:$$(git rev-parse --short HEAD)
	@echo "Pushing image to $(ACR_LOGIN_SERVER)..."
	docker push $(ACR_LOGIN_SERVER)/annie:latest
	docker push $(ACR_LOGIN_SERVER)/annie:$$(git rev-parse --short HEAD)
	@echo "✓ Image pushed"

deploy-dev:
	@echo "Deploying to Azure dev environment..."
	./deploy.sh annie dev eastus

deploy-staging:
	@echo "Deploying to Azure staging environment..."
	./deploy.sh annie staging eastus

deploy-prod:
	@echo "Deploying to Azure production environment..."
	./deploy.sh annie prod eastus

logs:
	@if [ -z "$(WEBAPP_NAME)" ] || [ -z "$(RESOURCE_GROUP)" ]; then \
		echo "Error: Set WEBAPP_NAME and RESOURCE_GROUP"; \
		exit 1; \
	fi
	az webapp log tail --name $(WEBAPP_NAME) --resource-group $(RESOURCE_GROUP)

health:
	@echo "Checking application health..."
	@curl -s http://localhost:8080/health | jq . || echo "Application not running"

ready:
	@echo "Checking application readiness..."
	@curl -s http://localhost:8080/ready | jq . || echo "Application not running"

deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy
	@echo "✓ Dependencies updated"

install-tools:
	@echo "Installing development tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "✓ Tools installed"

.DEFAULT_GOAL := help
