# Annie - Azure Deployment Guide

Complete guide to deploying the Annie Go backend to Microsoft Azure with one-click automation.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [One-Click Deployment](#one-click-deployment)
3. [Manual Deployment](#manual-deployment)
4. [Configuration](#configuration)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Cost Estimation](#cost-estimation)

## Prerequisites

### Required Software

- **Azure CLI**: [Install Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Docker**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Git**: [Install Git](https://git-scm.com/downloads)
- **Go 1.21+** (optional, for local development)
- **PowerShell 7+** (for Windows deployment scripts)

### Azure Account

- Active Azure subscription with billing enabled
- Sufficient resource quota for:
  - App Service (Premium tier)
  - Container Registry (Standard tier)
  - Cognitive Search (Standard tier)
  - Cognitive Services (OpenAI, Standard tier)

### Azure Permissions

Your account needs these roles:
- Contributor on the subscription or resource group
- Owner or Contributor on App Service
- Owner or Contributor on Container Registry

Verify permissions:
```bash
az role assignment list --include-inherited
```

## One-Click Deployment

### Option 1: Linux/macOS Bash Script

1. **Navigate to repository:**
   ```bash
   cd Annie
   ```

2. **Make script executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run deployment:**
   ```bash
   ./deploy.sh [project-name] [environment] [azure-region]
   ```

   **Examples:**
   ```bash
   # Default deployment (annie, dev, eastus)
   ./deploy.sh
   
   # Custom deployment
   ./deploy.sh myproject staging westus2
   
   # Different environments
   ./deploy.sh annie prod eastus
   ```

4. **Available Azure Regions:**
   - `eastus` (US East)
   - `westus2` (US West 2)
   - `centralus` (US Central)
   - `northeurope` (Europe North)
   - `westeurope` (Europe West)
   - `eastasia` (Asia East)
   - `southeastasia` (Asia Southeast)

### Option 2: Windows PowerShell Script

1. **Open PowerShell as Administrator:**
   ```powershell
   Start-Process powershell -Verb RunAs
   ```

2. **Navigate to repository:**
   ```powershell
   cd Annie
   ```

3. **Allow script execution:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```

4. **Run deployment:**
   ```powershell
   .\deploy.ps1 -ProjectName annie -Environment dev -AzureRegion eastus
   ```

### What Happens During Deployment

1. **Prerequisites Check**
   - Verifies Azure CLI, Docker, and Git are installed
   - Confirms Azure CLI authentication

2. **Infrastructure Creation**
   - Creates Azure Resource Group
   - Deploys App Service Plan (Premium V2)
   - Provisions App Service (Web App)
   - Creates Container Registry
   - Sets up Key Vault

3. **AI Services Setup**
   - Deploys Azure Cognitive Search
   - Provisions Azure OpenAI service
   - Configures endpoints and keys

4. **Application Deployment**
   - Builds Docker image
   - Pushes to Container Registry
   - Configures App Service with Docker settings
   - Restarts application

5. **Health Verification**
   - Waits for application startup (up to 5 minutes)
   - Performs health checks
   - Generates deployment summary

### Deployment Output

Successful deployment provides:

```
Resource Group: annie-rg-dev
App URL: https://annie-app-dev.azurewebsites.net
Container Registry: acrXXXXXX.azurecr.io
Search Endpoint: https://annie-search-dev.search.windows.net
OpenAI Endpoint: https://annie-openai-dev.openai.azure.com

API Endpoints:
  - Health: https://annie-app-dev.azurewebsites.net/health
  - Docket Lookup: POST https://annie-app-dev.azurewebsites.net/api/v1/docket/lookup
  - Outcomes: POST https://annie-app-dev.azurewebsites.net/api/v1/outcomes/compare
  - Attorney: POST https://annie-app-dev.azurewebsites.net/api/v1/attorneys/find
```

A `DEPLOYMENT_SUMMARY.md` file is created with all deployment details.

## Manual Deployment

For more control or debugging, follow these manual steps.

### Step 1: Login to Azure

```bash
az login
az account set --subscription <SUBSCRIPTION_ID>
```

Verify:
```bash
az account show
```

### Step 2: Create Resource Group

```bash
az group create \
  --name annie-rg-dev \
  --location eastus
```

Verify:
```bash
az group show --name annie-rg-dev
```

### Step 3: Deploy Base Infrastructure

```bash
az deployment group create \
  --name annie-infrastructure \
  --resource-group annie-rg-dev \
  --template-file azure/main.bicep \
  --parameters \
    location=eastus \
    projectName=annie \
    environment=dev
```

Save the outputs:
```bash
az deployment group show \
  --name annie-infrastructure \
  --resource-group annie-rg-dev \
  --query properties.outputs \
  --output json
```

### Step 4: Deploy AI Services

```bash
az deployment group create \
  --name annie-ai-services \
  --resource-group annie-rg-dev \
  --template-file azure/ai-services.bicep \
  --parameters \
    location=eastus \
    projectName=annie \
    environment=dev
```

Get AI service endpoints:
```bash
az deployment group show \
  --name annie-ai-services \
  --resource-group annie-rg-dev \
  --query properties.outputs \
  --output json
```

### Step 5: Build Docker Image

```bash
docker build -t annie:latest \
  --build-arg VERSION=1.0.0 \
  -f Dockerfile .
```

Verify image:
```bash
docker images | grep annie
```

### Step 6: Login to Azure Container Registry

Get registry name from outputs, then:
```bash
az acr login --name acrXXXXXX
```

Get credentials:
```bash
az acr credential show --name acrXXXXXX
```

### Step 7: Push Image to Registry

```bash
docker tag annie:latest acrXXXXXX.azurecr.io/annie:latest
docker push acrXXXXXX.azurecr.io/annie:latest
```

Verify push:
```bash
az acr repository list --name acrXXXXXX
az acr repository show-tags --name acrXXXXXX --repository annie
```

### Step 8: Configure App Service

Get App Service name from outputs, then:

```bash
ACR_NAME=acrXXXXXX
ACR_URL=https://${ACR_NAME}.azurecr.io
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

az webapp deployment container config \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --docker-custom-image-name "${ACR_URL}/annie:latest" \
  --docker-registry-server-url "${ACR_URL}" \
  --docker-registry-server-username "${ACR_USERNAME}" \
  --docker-registry-server-password "${ACR_PASSWORD}"
```

### Step 9: Set Environment Variables

```bash
az webapp config appsettings set \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --settings \
    ENVIRONMENT=production \
    LOG_LEVEL=info \
    ENABLE_CACHING=true \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
```

### Step 10: Start Application

```bash
az webapp start --name annie-app-dev --resource-group annie-rg-dev
```

### Step 11: Verify Deployment

```bash
# Check app status
az webapp show --name annie-app-dev --resource-group annie-rg-dev --query state

# Test health endpoint
curl https://annie-app-dev.azurewebsites.net/health

# View logs
az webapp log tail --name annie-app-dev --resource-group annie-rg-dev
```

## Configuration

### Environment Variables

Set in App Service Configuration:

```bash
az webapp config appsettings set \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --settings \
    AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net \
    AZURE_SEARCH_KEY=your-key \
    AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com \
    AZURE_OPENAI_KEY=your-key \
    AZURE_OPENAI_API_VERSION=2024-05-01-preview \
    AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment \
    ENVIRONMENT=production \
    LOG_LEVEL=info
```

### Using Azure Key Vault

Store secrets securely:

```bash
# Create Key Vault secret
az keyvault secret set \
  --vault-name kv-annie-XXXXX \
  --name AzureSearchKey \
  --value your-actual-key

# Reference in app settings
az webapp config appsettings set \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --settings AZURE_SEARCH_KEY=@Microsoft.KeyVault(SecretUri=https://kv-annie-XXXXX.vault.azure.net/secrets/AzureSearchKey)
```

### Networking Configuration

Enable private endpoints (optional):

```bash
az network private-endpoint create \
  --name annie-app-endpoint \
  --resource-group annie-rg-dev \
  --vnet-name your-vnet \
  --subnet your-subnet \
  --private-connection-resource-id /subscriptions/.../annie-app-dev \
  --group-ids sites \
  --connection-name annie-app-connection
```

## Post-Deployment

### 1. Configure Azure Cognitive Search

Create search indices:

```bash
az search index create \
  --resource-group annie-rg-dev \
  --service-name annie-search-dev \
  --index-definition @search-index-schema.json
```

Ingest data:

```bash
az search index-batch create \
  --resource-group annie-rg-dev \
  --service-name annie-search-dev \
  --index-name caselaw-index \
  --documents @legal-documents.jsonl
```

### 2. Configure Azure OpenAI

Deploy models:

```bash
# Deploy GPT-4 or GPT-3.5-turbo
az cognitiveservices account deployment create \
  --name annie-openai-dev \
  --resource-group annie-rg-dev \
  --deployment-id gpt-4 \
  --model-name gpt-4 \
  --model-version "0125-preview"
```

### 3. Setup Monitoring

Enable Application Insights:

```bash
az monitor app-insights component create \
  --app annie-insights \
  --location eastus \
  --resource-group annie-rg-dev \
  --application-type web

# Link to App Service
az webapp config appsettings set \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=your-key
```

### 4. Configure Custom Domain

```bash
# Verify domain ownership
az webapp config hostname add \
  --webapp-name annie-app-dev \
  --resource-group annie-rg-dev \
  --hostname yourdomain.com

# Create SSL certificate
az webapp config ssl upload \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --certificate-file certificate.pfx \
  --certificate-password password

# Bind SSL certificate
az webapp config ssl bind \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --certificate-thumbprint your-thumbprint \
  --ssl-type SNI
```

### 5. Setup Backup

```bash
az appservice plan update \
  --name annie-asp-dev \
  --resource-group annie-rg-dev \
  --sku P1V2

az webapp backup create \
  --name annie-app-dev \
  --resource-group annie-rg-dev \
  --backup-name initial-backup
```

### 6. Configure Auto-Scaling

```bash
az appservice autoscale config create \
  --resource-group annie-rg-dev \
  --name annie-autoscale \
  --resource-name-prefix annie-asp-dev \
  --resource-type Microsoft.Web/serverfarms \
  --min-count 1 \
  --max-count 10
```

## Troubleshooting

### Deployment Fails at Prerequisites

```bash
# Check Azure CLI
az version

# Check Docker
docker version

# Check Git
git version

# Ensure logged in to Azure
az account show
```

### Container Registry Push Fails

```bash
# Verify ACR login
az acr login --name acrXXXXXX

# Check credentials
az acr credential show --name acrXXXXXX

# Reset credentials if needed
az acr credential rotate --name acrXXXXXX --password-name password
```

### Application Won't Start

```bash
# Check app status
az webapp show --name annie-app-dev --resource-group annie-rg-dev

# View logs
az webapp log tail --name annie-app-dev --resource-group annie-rg-dev --provider application

# Restart application
az webapp restart --name annie-app-dev --resource-group annie-rg-dev

# Check app settings
az webapp config appsettings list --name annie-app-dev --resource-group annie-rg-dev
```

### Health Check Fails

```bash
# Verify API endpoint
curl https://annie-app-dev.azurewebsites.net/health -v

# Check if Azure services are accessible
curl https://your-search.search.windows.net
curl https://your-openai.openai.azure.com

# Verify credentials in app settings
az webapp config appsettings list --name annie-app-dev --resource-group annie-rg-dev | grep AZURE
```

### High Latency or Timeouts

```bash
# Check App Service metrics
az monitor metrics list \
  --resource-group annie-rg-dev \
  --resource annie-app-dev \
  --resource-type "Microsoft.Web/sites" \
  --metric ResponseTime

# Check if scale-up is needed
az appservice plan show --name annie-asp-dev --resource-group annie-rg-dev
```

### Azure Search Not Working

```bash
# Verify search service is running
az search service show --name annie-search-dev --resource-group annie-rg-dev

# Check search indices
az search index list --service-name annie-search-dev

# Test search connection
curl -X GET https://annie-search-dev.search.windows.net/indexes?api-version=2023-11-01 \
  -H "api-key: YOUR_SEARCH_KEY"
```

### OpenAI Connection Issues

```bash
# Verify OpenAI service
az cognitiveservices account show --name annie-openai-dev --resource-group annie-rg-dev

# List deployments
az cognitiveservices account deployment list --name annie-openai-dev --resource-group annie-rg-dev

# Check if deployment is ready
curl https://annie-openai-dev.openai.azure.com/status -H "api-key: YOUR_OPENAI_KEY"
```

## Cost Estimation

### Monthly Costs (Approximate)

| Service | Tier | Estimated Cost |
|---------|------|-----------------|
| App Service | Premium V2 (P1V2) | $170 |
| Container Registry | Standard | $100 |
| Cognitive Search | Standard | $250 |
| OpenAI | Pay-per-use | $50-200 |
| Key Vault | Standard | $0.60 |
| **Total** | | **$570-620** |

### Cost Optimization

1. **Dev/Test Environments**
   - Use B1 tier for dev ($30/month)
   - Share resources across projects

2. **Reserved Instances**
   - 1-year commitment: 10-15% discount
   - 3-year commitment: 20-30% discount

3. **Auto-Scaling**
   - Scale to 0 instances during off-hours
   - Use B tier for variable workloads

4. **Spot Instances**
   - Use for non-critical workloads
   - Save up to 70% vs regular pricing

### View Actual Costs

```bash
# Cost analysis by resource
az cost management query create \
  --query '{type: "Usage", timeframe: "MonthToDate", granularity: "Daily", aggregation: {totalCost: {name: "PreTaxCost", function: "Sum"}}, groupBy: [{type: "Dimension", name: "ResourceType"}]}' \
  --scope /subscriptions/YOUR_SUBSCRIPTION_ID
```

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Configure Azure services
3. ⬜ Configure custom domain
4. ⬜ Setup monitoring and alerts
5. ⬜ Setup CI/CD pipeline
6. ⬜ Connect frontend application
7. ⬜ Load test and optimize
8. ⬜ Setup backup and disaster recovery

## Support & Resources

- [Azure App Service Documentation](https://learn.microsoft.com/en-us/azure/app-service/)
- [Azure Container Registry Documentation](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Azure Cognitive Search Documentation](https://learn.microsoft.com/en-us/azure/search/)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Bicep Language Documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

---

**Happy Deploying! 🚀**
