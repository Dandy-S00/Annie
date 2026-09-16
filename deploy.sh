#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME=${1:-annie}
ENVIRONMENT=${2:-dev}
AZURE_REGION=${3:-eastus}
RESOURCE_GROUP="${PROJECT_NAME}-rg-${ENVIRONMENT}"

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Annie - Azure Deployment Script${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo -e "Project Name: ${GREEN}${PROJECT_NAME}${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Region: ${GREEN}${AZURE_REGION}${NC}"
echo -e "Resource Group: ${GREEN}${RESOURCE_GROUP}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites are installed${NC}"
echo ""

# Login to Azure
echo -e "${YELLOW}Logging in to Azure...${NC}"
az login

# Get current subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo -e "${GREEN}✓ Using subscription: ${SUBSCRIPTION_ID}${NC}"
echo ""

# Create resource group
echo -e "${YELLOW}Creating resource group...${NC}"
az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${AZURE_REGION}"
echo -e "${GREEN}✓ Resource group created${NC}"
echo ""

# Deploy infrastructure
echo -e "${YELLOW}Deploying infrastructure...${NC}"
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file azure/main.bicep \
    --parameters \
        location="${AZURE_REGION}" \
        projectName="${PROJECT_NAME}" \
        environment="${ENVIRONMENT}" \
    --query 'properties.outputs' \
    --output json)

ACR_LOGIN_SERVER=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.containerRegistryLoginServer.value')
APP_URL=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.webAppUrl.value')
APP_NAME=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.webAppName.value')

echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo -e "Container Registry: ${GREEN}${ACR_LOGIN_SERVER}${NC}"
echo -e "Web App URL: ${GREEN}${APP_URL}${NC}"
echo ""

# Deploy AI services
echo -e "${YELLOW}Deploying AI services...${NC}"
AI_DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file azure/ai-services.bicep \
    --parameters \
        location="${AZURE_REGION}" \
        projectName="${PROJECT_NAME}" \
        environment="${ENVIRONMENT}" \
    --query 'properties.outputs' \
    --output json)

SEARCH_ENDPOINT=$(echo "${AI_DEPLOYMENT_OUTPUT}" | jq -r '.searchEndpoint.value')
OPENAI_ENDPOINT=$(echo "${AI_DEPLOYMENT_OUTPUT}" | jq -r '.openAIEndpoint.value')

echo -e "${GREEN}✓ AI services deployed${NC}"
echo -e "Search Endpoint: ${GREEN}${SEARCH_ENDPOINT}${NC}"
echo -e "OpenAI Endpoint: ${GREEN}${OPENAI_ENDPOINT}${NC}"
echo ""

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t "${ACR_LOGIN_SERVER}/annie:latest" -f Dockerfile .
echo -e "${GREEN}✓ Docker image built${NC}"
echo ""

# Login to ACR
echo -e "${YELLOW}Logging in to Azure Container Registry...${NC}"
az acr login --name "$(echo ${ACR_LOGIN_SERVER} | sed 's/\.azurecr\.io//')"
echo -e "${GREEN}✓ ACR login successful${NC}"
echo ""

# Push image to ACR
echo -e "${YELLOW}Pushing image to ACR...${NC}"
docker push "${ACR_LOGIN_SERVER}/annie:latest"
echo -e "${GREEN}✓ Image pushed to ACR${NC}"
echo ""

# Retrieve secrets and configure app settings
echo -e "${YELLOW}Configuring application settings...${NC}"

# Get App Service credentials for Docker
ACR_USERNAME=$(az acr credential show --name "$(echo ${ACR_LOGIN_SERVER} | sed 's/\.azurecr\.io//')" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$(echo ${ACR_LOGIN_SERVER} | sed 's/\.azurecr\.io//')" --query passwords[0].value -o tsv)

# Update app settings (example - requires actual Azure credentials to be set up in Key Vault)
az webapp config appsettings set \
    --name "${APP_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --settings \
        DOCKER_REGISTRY_SERVER_URL="https://${ACR_LOGIN_SERVER}" \
        DOCKER_REGISTRY_SERVER_USERNAME="${ACR_USERNAME}" \
        DOCKER_REGISTRY_SERVER_PASSWORD="${ACR_PASSWORD}"

echo -e "${GREEN}✓ Application settings configured${NC}"
echo ""

# Restart the app service
echo -e "${YELLOW}Restarting App Service...${NC}"
az webapp restart --name "${APP_NAME}" --resource-group "${RESOURCE_GROUP}"
echo -e "${GREEN}✓ App Service restarted${NC}"
echo ""

# Wait for app to be ready
echo -e "${YELLOW}Waiting for application to be ready...${NC}"
for i in {1..30}; do
    if curl -s "${APP_URL}/health" > /dev/null; then
        echo -e "${GREEN}✓ Application is ready${NC}"
        break
    fi
    echo "Attempt $i/30..."
    sleep 10
done
echo ""

# Display deployment summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Completed Successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Resource Group: ${GREEN}${RESOURCE_GROUP}${NC}"
echo -e "App URL: ${GREEN}${APP_URL}${NC}"
echo -e "Container Registry: ${GREEN}${ACR_LOGIN_SERVER}${NC}"
echo -e "API Health: ${GREEN}${APP_URL}/health${NC}"
echo -e "API Readiness: ${GREEN}${APP_URL}/ready${NC}"
echo ""
echo -e "${YELLOW}API Endpoints:${NC}"
echo -e "  - Docket Lookup: POST ${GREEN}${APP_URL}/api/v1/docket/lookup${NC}"
echo -e "  - Compare Outcomes: POST ${GREEN}${APP_URL}/api/v1/outcomes/compare${NC}"
echo -e "  - Find Attorney: POST ${GREEN}${APP_URL}/api/v1/attorneys/find${NC}"
echo ""

# Create deployment summary file
cat > DEPLOYMENT_SUMMARY.md << EOF
# Annie - Azure Deployment Summary

## Deployment Information
- **Project Name**: ${PROJECT_NAME}
- **Environment**: ${ENVIRONMENT}
- **Region**: ${AZURE_REGION}
- **Resource Group**: ${RESOURCE_GROUP}
- **Deployment Date**: $(date)

## Resources Created

### Application
- **Web App**: ${APP_NAME}
- **URL**: ${APP_URL}

### Container
- **Registry**: ${ACR_LOGIN_SERVER}
- **Image**: ${ACR_LOGIN_SERVER}/annie:latest

### AI Services
- **Search Endpoint**: ${SEARCH_ENDPOINT}
- **OpenAI Endpoint**: ${OPENAI_ENDPOINT}

## API Endpoints

### Health Check
- **GET** ${APP_URL}/health

### Ready Check
- **GET** ${APP_URL}/ready

### Docket Lookup
- **POST** ${APP_URL}/api/v1/docket/lookup
```json
{
  "case_number": "2024-CV-001",
  "county": "Dallas"
}
```

### Compare Outcomes
- **POST** ${APP_URL}/api/v1/outcomes/compare
```json
{
  "charge_type": "Drug Possession",
  "context": "First time offense"
}
```

### Find Attorney
- **POST** ${APP_URL}/api/v1/attorneys/find
```json
{
  "specialty_area": "Criminal Defense",
  "county": "Dallas"
}
```

## Environment Variables
The following environment variables should be configured in Azure Key Vault:
- \`AZURE_SEARCH_ENDPOINT\`: ${SEARCH_ENDPOINT}
- \`AZURE_OPENAI_ENDPOINT\`: ${OPENAI_ENDPOINT}
- \`AZURE_OPENAI_DEPLOYMENT_NAME\`: Your OpenAI deployment name
- \`ENVIRONMENT\`: ${ENVIRONMENT}
- \`LOG_LEVEL\`: info

## Next Steps
1. Configure Azure Cognitive Search indices
2. Deploy OpenAI models to Azure OpenAI service
3. Set up Azure Key Vault secrets
4. Configure application logging and monitoring

## Troubleshooting

### View App Logs
\`\`\`bash
az webapp log tail --name ${APP_NAME} --resource-group ${RESOURCE_GROUP}
\`\`\`

### Restart Application
\`\`\`bash
az webapp restart --name ${APP_NAME} --resource-group ${RESOURCE_GROUP}
\`\`\`

### Check Application Settings
\`\`\`bash
az webapp config appsettings list --name ${APP_NAME} --resource-group ${RESOURCE_GROUP}
\`\`\`
EOF

echo -e "${GREEN}✓ Deployment summary saved to DEPLOYMENT_SUMMARY.md${NC}"
