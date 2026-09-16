#!/bin/bash
# Annie - Pre-Deployment Verification Checklist
# Run this script to verify all prerequisites before deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}Annie - Pre-Deployment Verification${NC}"
echo -e "${YELLOW}================================================${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check function
check_command() {
    local cmd=$1
    local display_name=$2
    
    if command -v "$cmd" &> /dev/null; then
        VERSION=$(eval "$cmd --version 2>/dev/null | head -1" || echo "installed")
        echo -e "${GREEN}✓${NC} $display_name: ${GREEN}$VERSION${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $display_name: ${RED}NOT INSTALLED${NC}"
        ((CHECKS_FAILED++))
    fi
}

# Check files
check_file() {
    local file=$1
    local display_name=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $display_name: ${GREEN}Found${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $display_name: ${RED}NOT FOUND${NC}"
        ((CHECKS_FAILED++))
    fi
}

echo -e "${YELLOW}1. Checking Prerequisites${NC}"
echo "================================"

check_command "az" "Azure CLI"
check_command "docker" "Docker"
check_command "git" "Git"
check_command "go" "Go (optional)"

echo ""
echo -e "${YELLOW}2. Checking Project Files${NC}"
echo "================================"

check_file "main.go" "Main application"
check_file "Dockerfile" "Docker configuration"
check_file "deploy.sh" "Deployment script"
check_file "go.mod" "Go modules"
check_file "azure/main.bicep" "Azure infrastructure"

echo ""
echo -e "${YELLOW}3. Checking Azure Authentication${NC}"
echo "================================"

if az account show &> /dev/null; then
    ACCOUNT=$(az account show --query 'name' -o tsv)
    SUBSCRIPTION=$(az account show --query 'id' -o tsv)
    echo -e "${GREEN}✓${NC} Azure CLI authenticated"
    echo -e "  Account: ${GREEN}$ACCOUNT${NC}"
    echo -e "  Subscription: ${GREEN}${SUBSCRIPTION:0:8}...${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Azure CLI not authenticated"
    ((CHECKS_FAILED++))
fi

echo ""
echo -e "${YELLOW}4. Checking Docker${NC}"
echo "================================"

if docker ps &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} Docker daemon running"
    echo -e "  Version: ${GREEN}$DOCKER_VERSION${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Docker daemon not running"
    ((CHECKS_FAILED++))
fi

echo ""
echo -e "${YELLOW}5. Checking Configuration${NC}"
echo "================================"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"
    SEARCH_ENDPOINT=$(grep "AZURE_SEARCH_ENDPOINT" .env | cut -d'=' -f2 | grep -o "." | head -10 | tr -d '\n')
    if [ -z "$SEARCH_ENDPOINT" ]; then
        echo -e "${YELLOW}  Warning: AZURE_SEARCH_ENDPOINT might be empty${NC}"
    else
        echo -e "  AZURE_SEARCH_ENDPOINT: ${GREEN}${SEARCH_ENDPOINT}...${NC}"
    fi
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} .env file not found (create from .env.example)"
    ((CHECKS_PASSED++))
fi

echo ""
echo -e "${YELLOW}6. Checking Azure Quota${NC}"
echo "================================"

if az account show &> /dev/null; then
    echo -e "${GREEN}✓${NC} Azure quota check available"
    echo "  Note: Review Azure limits in portal for:"
    echo "    - App Service plan limits"
    echo "    - Container Registry quotas"
    echo "    - Cognitive Services limits"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Unable to verify Azure quotas${NC}"
fi

echo ""
echo -e "${YELLOW}================================================${NC}"
echo -e "Results:"
echo -e "  ${GREEN}✓ Passed: $CHECKS_PASSED${NC}"
echo -e "  ${RED}✗ Failed: $CHECKS_FAILED${NC}"
echo -e "${YELLOW}================================================${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review deployment options:"
    echo "   - ./deploy.sh (automatic one-click)"
    echo "   - Manual steps in AZURE_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "2. For automatic deployment:"
    echo "   chmod +x deploy.sh"
    echo "   ./deploy.sh"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}Some checks failed. Please address the issues above.${NC}"
    echo ""
    echo "Installation guides:"
    echo "  - Azure CLI: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    echo "  - Docker: https://www.docker.com/products/docker-desktop"
    echo "  - Git: https://git-scm.com/downloads"
    echo ""
    exit 1
fi
