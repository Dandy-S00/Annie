# Annie — Texas Legal Guidance Platform

Annie is a cloud-native Go backend (with a Capacitor/web frontend) that helps Texas defendants understand their legal situation:

- 🔍 **Docket Lookup** — case status by case number and county
- ⚖️ **Outcome Comparison** — how similar cases were resolved
- 👩‍⚖️ **Attorney Finder** — connect with qualified criminal defense attorneys

Live demo: [annie-wheat-nine.vercel.app](https://annie-wheat-nine.vercel.app)

## Architecture

```
Annie
├── main.go                # Go backend entry point
├── internal/
│   ├── api/handlers.go    # REST endpoint handlers
│   ├── service/azure.go   # Azure SDK integration (Search + OpenAI)
│   ├── service/legal.go   # Legal business logic
│   └── config/config.go   # Configuration management
├── azure/                 # Bicep infrastructure-as-code
├── tx-law-app/             # Frontend (Capacitor + Web)
├── tx-law-agent/           # Legal agent logic
└── .github/workflows/      # CI/CD pipeline
```

Backed by **Azure Cognitive Search** (document search), **Azure OpenAI** (AI analysis/summaries), and **Azure App Service** for hosting.

## Quick Start

**Prerequisites:** Go 1.21+, Docker, Azure CLI, Git

```bash
git clone https://github.com/Dandy-S00/Annie.git
cd Annie
cp .env.example .env       # then fill in your Azure credentials
go mod download
go run main.go             # serves on http://localhost:8080
```

Verify it's running:

```bash
curl http://localhost:8080/health
```

## API Overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/docket/lookup` | POST | Look up a case by number and county |
| `/api/v1/outcomes/compare` | POST | Compare outcomes for similar cases |
| `/api/v1/attorneys/find` | POST | Find attorneys by specialty and county |
| `/health`, `/ready` | GET | Health/readiness checks |

Full request/response schemas are in [`GO_README.md`](./GO_README.md).

## Deployment

One-click Azure deployment via `deploy.sh` / `deploy.ps1`, provisioning App Service, Container Registry, Cognitive Search, OpenAI, and Key Vault. See [`AZURE_DEPLOYMENT_GUIDE.md`](./AZURE_DEPLOYMENT_GUIDE.md) and [`HOSTINGER_DEPLOYMENT.md`](./HOSTINGER_DEPLOYMENT.md) for detailed steps, and [`QUICKSTART.md`](./QUICKSTART.md) for the condensed version.

```bash
./deploy.sh annie dev eastus
```

## Docker

```bash
docker build -t annie:latest .
docker run -p 8080:8080 --env-file .env annie:latest
```

## Testing

```bash
go test ./...
```

## Docs in this repo

- [`GO_README.md`](./GO_README.md) — full backend documentation
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system architecture details
- [`AZURE_DEPLOYMENT_GUIDE.md`](./AZURE_DEPLOYMENT_GUIDE.md) — Azure deployment walkthrough
- [`QUICKSTART.md`](./QUICKSTART.md) — fastest path to running locally
- [`CONVERSION_SUMMARY.md`](./CONVERSION_SUMMARY.md) — notes on the Python → Go migration

## License

MIT — see `LICENSE` for details.
