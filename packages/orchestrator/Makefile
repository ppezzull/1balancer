.PHONY: help install dev build start test lint typecheck clean logs docker-build docker-run

# Default target
help:
	@echo "1Balancer Orchestration Service Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Run in development mode with hot reload"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linter"
	@echo "  make typecheck  - Run TypeScript type checking"
	@echo ""
	@echo "Production:"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production server"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make logs       - Tail production logs"

# Install dependencies
install:
	yarn install

# Development mode with hot reload
dev:
	yarn dev

# Build TypeScript for production
build:
	yarn build

# Start production server
start:
	yarn start

# Run tests
test:
	yarn test

# Run linter
lint:
	yarn lint

# TypeScript type checking
typecheck:
	yarn typecheck

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf logs

# Tail logs
logs:
	tail -f logs/*.log

# Docker build
docker-build:
	docker build -t 1balancer/orchestrator:latest .

# Docker run
docker-run:
	docker run -d \
		--name 1balancer-orchestrator \
		-p 8080:8080 \
		--env-file .env \
		1balancer/orchestrator:latest

# Development setup (install and copy env)
setup: install
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file - please configure it"; \
	fi

# Check if all required env vars are set
check-env:
	@echo "Checking environment configuration..."
	@node -e "require('./dist/config').validateConfig()"

# Generate API documentation
docs:
	@echo "Generating API documentation..."
	@npx swagger-jsdoc -d swaggerDef.js -o ./docs/api.json ./src/api/routes/*.ts

# Run specific test file
test-file:
	yarn jest $(FILE)

# Watch tests
test-watch:
	yarn test:watch

# Format code
format:
	yarn prettier --write "src/**/*.ts"

# Check code formatting
format-check:
	yarn prettier --check "src/**/*.ts"

# Full CI pipeline
ci: clean install lint typecheck build test

# Quick health check
health:
	curl -f http://localhost:8080/health || exit 1

# Monitor metrics
metrics:
	watch -n 5 'curl -s http://localhost:8080/metrics | grep orchestrator_'

# Redis targets removed - using in-memory storage
# Uncomment below if Redis is needed in the future
# redis-start:
# 	docker run -d --name orchestrator-redis -p 6379:6379 redis:alpine
#
# redis-stop:
# 	docker stop orchestrator-redis && docker rm orchestrator-redis

# Production deployment helpers
deploy-staging:
	@echo "Deploying to staging..."
	# Add staging deployment commands

deploy-production:
	@echo "Deploying to production..."
	# Add production deployment commands