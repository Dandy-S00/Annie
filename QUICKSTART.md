# Annie - Quick Start Guide

Get Annie running on Azure in under 5 minutes! 🚀

## Option 1: One-Click Deploy (Recommended)

### macOS/Linux
```bash
cd Annie
chmod +x deploy.sh
./deploy.sh
```

### Windows (PowerShell)
```powershell
cd Annie
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\deploy.ps1
```

**That's it!** Your application will be deployed to Azure and accessible within 2-3 minutes.

---

## Option 2: Manual Local Development

### Prerequisites
- [Go 1.21+](https://golang.org/doc/install)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)

### 1. Setup Environment
```bash
cd Annie
cp .env.example .env
```

Edit `.env` with your Azure credentials:
```env
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
```

### 2. Run Locally
```bash
# Using Go directly
go run main.go

# Or using Make
make dev

# Or using Docker
docker-compose up
```

Server starts on `http://localhost:8080`

### 3. Test the API
```bash
# Health check
curl http://localhost:8080/health

# Docket lookup
curl -X POST http://localhost:8080/api/v1/docket/lookup \
  -H "Content-Type: application/json" \
  -d '{"case_number":"2024-CV-001","county":"Dallas"}'
```

---

## Option 3: Deploy to Azure Manually

### Prerequisites
```bash
# Install/Login to Azure CLI
az login
az account set --subscription YOUR_SUBSCRIPTION_ID
```

### 1. Create Resource Group
```bash
az group create -n annie-rg-dev -l eastus
```

### 2. Deploy Infrastructure
```bash
az deployment group create \
  --resource-group annie-rg-dev \
  --template-file azure/main.bicep \
  --parameters location=eastus projectName=annie environment=dev
```

### 3. Deploy AI Services
```bash
az deployment group create \
  --resource-group annie-rg-dev \
  --template-file azure/ai-services.bicep
```

### 4. Build & Push Docker Image
```bash
docker build -t annie:latest .
az acr login --name REGISTRY_NAME
docker tag annie:latest REGISTRY_NAME.azurecr.io/annie:latest
docker push REGISTRY_NAME.azurecr.io/annie:latest
```

### 5. Configure App Service
```bash
az webapp deployment container config \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --docker-custom-image-name REGISTRY_NAME.azurecr.io/annie:latest \
  --docker-registry-server-url https://REGISTRY_NAME.azurecr.io \
  --docker-registry-server-username USERNAME \
  --docker-registry-server-password PASSWORD
```

### 6. Restart
```bash
az webapp restart --name annie-app-dev --resource-group annie-rg-dev
```

---

## Using Make Commands

```bash
# Build locally
make build

# Run locally
make run

# Build Docker image
make docker-build

# Deploy to dev
make deploy-dev

# View logs
make logs WEBAPP_NAME=annie-app-dev RESOURCE_GROUP=annie-rg-dev

# Check health
make health
```

---

## 🎯 After Deployment

Your app is now live at: `https://annie-app-dev.azurewebsites.net`

### API Endpoints
- **Health**: `GET /health`
- **Readiness**: `GET /ready`
- **Docket Lookup**: `POST /api/v1/docket/lookup`
- **Compare Outcomes**: `POST /api/v1/outcomes/compare`
- **Find Attorney**: `POST /api/v1/attorneys/find`

### Next Steps
1. Configure Azure Cognitive Search indices
2. Deploy OpenAI models
3. Set up monitoring and logging
4. Connect your frontend (tx-law-app)
5. Configure custom domain

---

## ❓ Troubleshooting

### "Command not found"
- Ensure Go, Docker, and Azure CLI are installed and in PATH
- Run `go version`, `docker version`, `az version` to verify

### "Authentication failed"
```bash
az login
az account set --subscription YOUR_ID
```

### "Application not starting"
```bash
# View logs
az webapp log tail --name annie-app-dev --resource-group annie-rg-dev

# Check app settings
az webapp config appsettings list --name annie-app-dev --resource-group annie-rg-dev
```

### "API returns 500 error"
- Check Azure credentials in `.env`
- Verify Azure Search and OpenAI services are accessible
- Review application logs for details

---

## 📞 Need Help?

- Check the [main README](GO_README.md) for detailed documentation
- Review [Azure documentation](https://learn.microsoft.com/en-us/azure/)
- Check application logs: `make logs`

---

**Happy coding! 🎉**
