# Annie - Texas Legal Guidance Platform (Go + Azure)

A modern, cloud-native Go backend for the Annie Texas legal guidance platform, designed for one-click deployment to Microsoft Azure.

## 🎯 Overview

Annie is a comprehensive legal guidance platform that helps Texas defendants understand:
- Court docket information and case statuses
- Outcomes of similar cases and common dispositions
- Connect with qualified criminal defense attorneys

This is the **Go backend** version, replacing the original Python FastAPI implementation, with full support for Azure deployment automation.

## 🏗️ Architecture

```
Annie (Go Backend)
├── Main Application
│   ├── API Handlers (REST endpoints)
│   ├── Legal Services (business logic)
│   ├── Azure Services (cloud integration)
│   └── Configuration Management
├── Deployment Infrastructure
│   ├── Docker (containerization)
│   ├── Bicep (Infrastructure as Code)
│   ├── GitHub Actions (CI/CD)
│   └── One-Click Deploy Scripts
└── Frontend (Capacitor + Web)
    ├── tx-law-app
    └── API Consumer
```

## ✨ Features

### Core API Endpoints
- **Docket Lookup** - Search for case information by case number and county
- **Outcome Comparison** - Analyze similar cases and common outcomes
- **Attorney Finder** - Locate qualified criminal defense attorneys

### Azure Integration
- **Azure Cognitive Search** - Full-text search over legal documents
- **Azure OpenAI** - AI-powered legal analysis and summaries
- **Azure App Service** - Scalable web hosting
- **Azure Container Registry** - Docker image storage
- **Azure Key Vault** - Secure credential management

### DevOps & Automation
- **One-Click Deployment** - Single command to deploy to Azure
- **Docker Support** - Containerized for portability
- **GitHub Actions** - Automated CI/CD pipeline
- **Health Checks** - Built-in health and readiness endpoints
- **Structured Logging** - Production-grade logging with Zap

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Docker & Docker Buildx
- Azure CLI
- Git
- PowerShell (for Windows) or Bash (for macOS/Linux)

### Local Development

1. **Clone and setup:**
```bash
cd Annie
cp .env.example .env
```

2. **Configure Azure credentials** in `.env`:
```bash
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_KEY=your-search-key
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com
AZURE_OPENAI_KEY=your-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
```

3. **Download dependencies:**
```bash
go mod download
```

4. **Run locally:**
```bash
go run main.go
```

The server will start on `http://localhost:8080`

5. **Test endpoints:**
```bash
# Health check
curl http://localhost:8080/health

# Readiness check
curl http://localhost:8080/ready

# Docket lookup
curl -X POST http://localhost:8080/api/v1/docket/lookup \
  -H "Content-Type: application/json" \
  -d '{"case_number":"2024-CV-001","county":"Dallas"}'

# Compare outcomes
curl -X POST http://localhost:8080/api/v1/outcomes/compare \
  -H "Content-Type: application/json" \
  -d '{"charge_type":"Drug Possession","context":"First offense"}'

# Find attorney
curl -X POST http://localhost:8080/api/v1/attorneys/find \
  -H "Content-Type: application/json" \
  -d '{"specialty_area":"Criminal Defense","county":"Dallas"}'
```

## 🌐 One-Click Azure Deployment

### Automated Deployment (Recommended)

#### macOS/Linux
```bash
chmod +x deploy.sh
./deploy.sh [project-name] [environment] [azure-region]

# Example:
./deploy.sh annie dev eastus
```

#### Windows (PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\deploy.ps1 -ProjectName annie -Environment dev -AzureRegion eastus
```

### What the Deployment Includes

✅ **Automated Infrastructure Setup**
- Resource group creation
- Azure Container Registry
- App Service Plan & Web App
- Azure Cognitive Search
- Azure OpenAI integration
- Key Vault for secrets

✅ **Containerization**
- Multi-stage Docker build
- Optimized image (Alpine-based)
- Automatic health checks

✅ **CI/CD Pipeline**
- GitHub Actions workflow
- Automated builds on push
- Automatic deployment
- Health check verification

✅ **Production Features**
- Auto-scaling configuration
- Monitoring & logging
- Environment-specific deployment
- Graceful shutdown handling

### Deployment Output

After successful deployment, you'll receive:
- **Resource Group**: `annie-rg-dev`
- **Web App URL**: `https://annie-app-dev.azurewebsites.net`
- **Container Registry**: `acrXXXXXX.azurecr.io`
- **API Endpoints**: Pre-configured and ready to use

### Manual Azure Deployment (Alternative)

If you prefer manual control:

```bash
# 1. Create resource group
az group create -n annie-rg-dev -l eastus

# 2. Deploy infrastructure
az deployment group create \
  --resource-group annie-rg-dev \
  --template-file azure/main.bicep \
  --parameters location=eastus projectName=annie environment=dev

# 3. Deploy AI services
az deployment group create \
  --resource-group annie-rg-dev \
  --template-file azure/ai-services.bicep \
  --parameters location=eastus projectName=annie environment=dev

# 4. Build and push Docker image
docker build -t acrXXXXXX.azurecr.io/annie:latest .
docker push acrXXXXXX.azurecr.io/annie:latest

# 5. Configure App Service
az webapp deployment container config \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --docker-custom-image-name acrXXXXXX.azurecr.io/annie:latest \
  --docker-registry-server-url https://acrXXXXXX.azurecr.io \
  --docker-registry-server-username [username] \
  --docker-registry-server-password [password]
```

## 🔧 Configuration

### Environment Variables

```env
# Azure Services
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_DEPLOYMENT_NAME=deployment-name

# Application
ENVIRONMENT=production
PORT=8080
LOG_LEVEL=info
ENABLE_CACHING=true
```

### Azure Key Vault Integration

Store sensitive data in Azure Key Vault:

```bash
# Set secrets
az keyvault secret set --name azure-search-key \
  --vault-name kv-annie-XXXXX \
  --value your-key

# Reference in app settings
az webapp config appsettings set \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --settings AZURE_SEARCH_KEY=@Microsoft.KeyVault(SecretUri=https://...)
```

## 📊 API Documentation

### 1. Docket Lookup
**Endpoint:** `POST /api/v1/docket/lookup`

**Request:**
```json
{
  "case_number": "2024-CV-001234",
  "county": "Dallas"
}
```

**Response:**
```json
{
  "case_number": "2024-CV-001234",
  "county": "Dallas",
  "status": "Active",
  "filed_date": "2024-01-15",
  "description": "AI-generated case summary from Azure OpenAI"
}
```

### 2. Compare Outcomes
**Endpoint:** `POST /api/v1/outcomes/compare`

**Request:**
```json
{
  "charge_type": "Drug Possession",
  "context": "First-time offense, small amount"
}
```

**Response:**
```json
{
  "charge_type": "Drug Possession",
  "similar_cases": [
    {
      "case_id": "CASE-1",
      "charge_type": "Drug Possession",
      "outcome": "Probation",
      "citation": "Case citation..."
    }
  ],
  "analysis": "AI analysis of patterns and outcomes",
  "common_outcomes": {
    "Probation": {"percentage": 45.5, "count": 10},
    "Dismissal": {"percentage": 27.3, "count": 6}
  }
}
```

### 3. Find Attorney
**Endpoint:** `POST /api/v1/attorneys/find`

**Request:**
```json
{
  "specialty_area": "Criminal Defense",
  "county": "Dallas"
}
```

**Response:**
```json
{
  "attorneys": [
    {
      "name": "John Smith, Esq.",
      "phone": "(214) 555-0100",
      "email": "john@lawfirm.com",
      "website": "https://lawfirm.com",
      "area": "Criminal Defense"
    }
  ],
  "message": "Found 5 attorney(s) in Dallas specializing in Criminal Defense"
}
```

### Health Endpoints

**Health Check:**
```bash
GET /health
Response: {"status":"ok","timestamp":"2024-01-15T10:30:00Z"}
```

**Readiness Check:**
```bash
GET /ready
Response: {"status":"ready","timestamp":"2024-01-15T10:30:00Z"}
```

## 🐳 Docker

### Build Docker Image
```bash
docker build -t annie:latest .
```

### Run Container Locally
```bash
docker run -p 8080:8080 \
  -e AZURE_SEARCH_ENDPOINT=https://... \
  -e AZURE_SEARCH_KEY=... \
  -e AZURE_OPENAI_ENDPOINT=https://... \
  -e AZURE_OPENAI_KEY=... \
  -e AZURE_OPENAI_DEPLOYMENT_NAME=... \
  annie:latest
```

### Push to Azure Container Registry
```bash
az acr login --name acrXXXXXX
docker tag annie:latest acrXXXXXX.azurecr.io/annie:latest
docker push acrXXXXXX.azurecr.io/annie:latest
```

## 📈 Monitoring & Logs

### View Application Logs
```bash
# Stream logs from Azure App Service
az webapp log tail --name annie-app-dev --resource-group annie-rg-dev

# View with filtering
az webapp log tail --name annie-app-dev --resource-group annie-rg-dev | grep ERROR
```

### Application Insights (Optional)

Add Application Insights for advanced monitoring:

```bash
az monitor app-insights component create \
  --app annie-insights \
  --location eastus \
  --resource-group annie-rg-dev \
  --application-type web
```

## 🔐 Security Best Practices

1. **Never commit secrets** - Use `.env.example` as template
2. **Use Azure Key Vault** - Store all credentials there
3. **Enable HTTPS** - Azure App Service provides SSL by default
4. **Implement authentication** - Add API key or OAuth 2.0
5. **Rate limiting** - Implement rate limiting for endpoints
6. **CORS configuration** - Configure appropriately for your frontend

## 🧪 Testing

### Unit Tests
```bash
go test ./...
```

### Integration Tests
```bash
go test -tags=integration ./...
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8080/health

# Using hey
hey -z 60s -c 10 http://localhost:8080/health
```

## 📝 Project Structure

```
Annie/
├── main.go                 # Application entry point
├── go.mod & go.sum        # Go module definitions
├── internal/
│   ├── api/
│   │   └── handlers.go    # HTTP handlers
│   ├── service/
│   │   ├── azure.go       # Azure SDK integration
│   │   └── legal.go       # Business logic
│   └── config/
│       └── config.go      # Configuration management
├── azure/
│   ├── main.bicep         # App Service infrastructure
│   └── ai-services.bicep  # AI services infrastructure
├── Dockerfile             # Multi-stage Docker build
├── deploy.sh              # Linux/macOS deployment script
├── deploy.ps1             # Windows PowerShell deployment script
├── .github/
│   └── workflows/
│       └── deploy-azure.yml  # CI/CD pipeline
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🔄 CI/CD with GitHub Actions

The repository includes an automated CI/CD pipeline (`.github/workflows/deploy-azure.yml`):

### Setup GitHub Secrets
```bash
AZURE_CLIENT_ID         # Service principal client ID
AZURE_TENANT_ID         # Azure tenant ID
AZURE_SUBSCRIPTION_ID   # Azure subscription ID
ACR_NAME                # Container registry name
ACR_LOGIN_SERVER        # Container registry login server
ACR_USERNAME            # Registry username
ACR_PASSWORD            # Registry password
WEBAPP_NAME             # App Service name
RESOURCE_GROUP          # Azure resource group
```

### Deployment Triggers
- Push to `main` branch - Automatic deployment
- Workflow dispatch - Manual deployment with environment selection

## 🚨 Troubleshooting

### Application won't start
```bash
# Check logs
az webapp log tail --name annie-app-dev --resource-group annie-rg-dev

# Restart the app
az webapp restart --name annie-app-dev --resource-group annie-rg-dev
```

### API returning 500 errors
- Check Azure credentials in Key Vault
- Verify Azure Search and OpenAI services are running
- Check application logs for detailed errors

### Deployment fails
- Ensure all prerequisites are installed
- Verify Azure CLI authentication: `az account show`
- Check for naming conflicts in resource names
- Review Bicep templates for syntax errors

### Connection timeout
- Check Azure Firewall rules
- Verify public network access is enabled
- Test connectivity: `Test-NetConnection -ComputerName your-service.search.windows.net -Port 443`

## 📚 Additional Resources

- [Go Documentation](https://golang.org/doc/)
- [Azure SDK for Go](https://github.com/Azure/azure-sdk-for-go)
- [Bicep Documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure App Service Documentation](https://learn.microsoft.com/en-us/azure/app-service/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Issues
3. Check Azure documentation for service-specific issues
4. Create a new GitHub Issue with detailed information

## 🎉 Acknowledgments

- Built with Go 1.21
- Powered by Azure Cloud Services
- Legal data from Texas court systems
- Attorney information from State Bar of Texas

---

**Made with ❤️ for Texas legal justice**
