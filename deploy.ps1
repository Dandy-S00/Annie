#!/usr/bin/env pwsh

# Annie - Azure Deployment Script (Windows PowerShell)

param(
    [string]$ProjectName = "annie",
    [string]$Environment = "dev",
    [string]$AzureRegion = "eastus"
)

# Configuration
$ResourceGroup = "${ProjectName}-rg-${Environment}"

Write-Host "================================" -ForegroundColor Yellow
Write-Host "Annie - Azure Deployment Script" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Project Name: $ProjectName" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Green
Write-Host "Region: $AzureRegion" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$tools = @("az", "docker")
foreach ($tool in $tools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "$tool is not installed. Please install it first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ All prerequisites are installed" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "Logging in to Azure..." -ForegroundColor Yellow
az login

# Get current subscription
$SubscriptionId = az account show --query id -o tsv
Write-Host "✓ Using subscription: $SubscriptionId" -ForegroundColor Green
Write-Host ""

# Create resource group
Write-Host "Creating resource group..." -ForegroundColor Yellow
az group create `
    --name $ResourceGroup `
    --location $AzureRegion

Write-Host "✓ Resource group created" -ForegroundColor Green
Write-Host ""

# Deploy infrastructure
Write-Host "Deploying infrastructure..." -ForegroundColor Yellow
$DeploymentOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file azure/main.bicep `
    --parameters `
        location=$AzureRegion `
        projectName=$ProjectName `
        environment=$Environment `
    --query 'properties.outputs' `
    --output json | ConvertFrom-Json

$AcrLoginServer = $DeploymentOutput.containerRegistryLoginServer.value
$AppUrl = $DeploymentOutput.webAppUrl.value
$AppName = $DeploymentOutput.webAppName.value

Write-Host "✓ Infrastructure deployed" -ForegroundColor Green
Write-Host "Container Registry: $AcrLoginServer" -ForegroundColor Green
Write-Host "Web App URL: $AppUrl" -ForegroundColor Green
Write-Host ""

# Deploy AI services
Write-Host "Deploying AI services..." -ForegroundColor Yellow
$AiDeploymentOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file azure/ai-services.bicep `
    --parameters `
        location=$AzureRegion `
        projectName=$ProjectName `
        environment=$Environment `
    --query 'properties.outputs' `
    --output json | ConvertFrom-Json

$SearchEndpoint = $AiDeploymentOutput.searchEndpoint.value
$OpenAiEndpoint = $AiDeploymentOutput.openAIEndpoint.value

Write-Host "✓ AI services deployed" -ForegroundColor Green
Write-Host "Search Endpoint: $SearchEndpoint" -ForegroundColor Green
Write-Host "OpenAI Endpoint: $OpenAiEndpoint" -ForegroundColor Green
Write-Host ""

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
$ImageTag = "${AcrLoginServer}/annie:latest"
docker build -t $ImageTag -f Dockerfile .

Write-Host "✓ Docker image built" -ForegroundColor Green
Write-Host ""

# Login to ACR
Write-Host "Logging in to Azure Container Registry..." -ForegroundColor Yellow
$AcrName = $AcrLoginServer -replace "\.azurecr\.io$", ""
az acr login --name $AcrName

Write-Host "✓ ACR login successful" -ForegroundColor Green
Write-Host ""

# Push image to ACR
Write-Host "Pushing image to ACR..." -ForegroundColor Yellow
docker push $ImageTag

Write-Host "✓ Image pushed to ACR" -ForegroundColor Green
Write-Host ""

# Configure app settings
Write-Host "Configuring application settings..." -ForegroundColor Yellow

$AcrUsername = (az acr credential show --name $AcrName --query username -o tsv)
$AcrPassword = (az acr credential show --name $AcrName --query "passwords[0].value" -o tsv)

az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings `
        DOCKER_REGISTRY_SERVER_URL="https://$AcrLoginServer" `
        DOCKER_REGISTRY_SERVER_USERNAME=$AcrUsername `
        DOCKER_REGISTRY_SERVER_PASSWORD=$AcrPassword

Write-Host "✓ Application settings configured" -ForegroundColor Green
Write-Host ""

# Restart the app service
Write-Host "Restarting App Service..." -ForegroundColor Yellow
az webapp restart --name $AppName --resource-group $ResourceGroup

Write-Host "✓ App Service restarted" -ForegroundColor Green
Write-Host ""

# Wait for app to be ready
Write-Host "Waiting for application to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "$AppUrl/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Application is ready" -ForegroundColor Green
            break
        }
    }
    catch {
        # Continue waiting
    }
    
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts..."
    Start-Sleep -Seconds 10
}

Write-Host ""

# Display deployment summary
Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Green
Write-Host "App URL: $AppUrl" -ForegroundColor Green
Write-Host "Container Registry: $AcrLoginServer" -ForegroundColor Green
Write-Host "API Health: $AppUrl/health" -ForegroundColor Green
Write-Host "API Readiness: $AppUrl/ready" -ForegroundColor Green
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Yellow
Write-Host "  - Docket Lookup: POST $AppUrl/api/v1/docket/lookup" -ForegroundColor Green
Write-Host "  - Compare Outcomes: POST $AppUrl/api/v1/outcomes/compare" -ForegroundColor Green
Write-Host "  - Find Attorney: POST $AppUrl/api/v1/attorneys/find" -ForegroundColor Green
Write-Host ""

# Create deployment summary
$SummaryContent = @"
# Annie - Azure Deployment Summary

## Deployment Information
- **Project Name**: $ProjectName
- **Environment**: $Environment
- **Region**: $AzureRegion
- **Resource Group**: $ResourceGroup
- **Deployment Date**: $(Get-Date)

## Resources Created

### Application
- **Web App**: $AppName
- **URL**: $AppUrl

### Container
- **Registry**: $AcrLoginServer
- **Image**: $ImageTag

### AI Services
- **Search Endpoint**: $SearchEndpoint
- **OpenAI Endpoint**: $OpenAiEndpoint

## API Endpoints

### Health Check
- **GET** $AppUrl/health

### Ready Check
- **GET** $AppUrl/ready

### Docket Lookup
- **POST** $AppUrl/api/v1/docket/lookup
```json
{
  "case_number": "2024-CV-001",
  "county": "Dallas"
}
```

### Compare Outcomes
- **POST** $AppUrl/api/v1/outcomes/compare
```json
{
  "charge_type": "Drug Possession",
  "context": "First time offense"
}
```

### Find Attorney
- **POST** $AppUrl/api/v1/attorneys/find
```json
{
  "specialty_area": "Criminal Defense",
  "county": "Dallas"
}
```

## Environment Variables
Configure these in Azure Key Vault:
- AZURE_SEARCH_ENDPOINT: $SearchEndpoint
- AZURE_OPENAI_ENDPOINT: $OpenAiEndpoint
- AZURE_OPENAI_DEPLOYMENT_NAME: Your OpenAI deployment name
- ENVIRONMENT: $Environment

## Troubleshooting

### View App Logs
\`az webapp log tail --name $AppName --resource-group $ResourceGroup\`

### Restart Application
\`az webapp restart --name $AppName --resource-group $ResourceGroup\`
"@

$SummaryContent | Out-File -FilePath "DEPLOYMENT_SUMMARY.md" -Encoding UTF8
Write-Host "✓ Deployment summary saved to DEPLOYMENT_SUMMARY.md" -ForegroundColor Green
