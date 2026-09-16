# Annie - System Architecture & Deployment

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         END USERS                               │
│                    (Web & Mobile Apps)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AZURE FRONT DOOR                           │
│                    (Global Load Balancer)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
        ┌───────────────────┐  ┌──────────────────┐
        │ APP SERVICE PLAN  │  │ APP SERVICE PLAN │
        │    (Primary)      │  │  (Secondary)     │
        │  East US Region   │  │  West US Region  │
        └────────┬──────────┘  └────────┬─────────┘
                 │                      │
        ┌────────┴──────────────────────┴──────────┐
        │                                          │
        ▼                                          ▼
    ┌─────────────────┐                ┌─────────────────┐
    │   WEB APP (Go)  │                │   WEB APP (Go)  │
    │   :8080         │                │   :8080         │
    │                 │                │                 │
    │ • HTTP Server   │                │ • HTTP Server   │
    │ • API Handlers  │                │ • API Handlers  │
    │ • Business Logic│                │ • Business Logic│
    │ • Logging       │                │ • Logging       │
    └────────┬────────┘                └────────┬────────┘
             │                                  │
             │ API Calls                        │
             └──────────────┬───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   CONTAINER  │  │   KEY VAULT  │  │   LOG        │
    │   REGISTRY   │  │              │  │  ANALYTICS   │
    │              │  │ • Secrets    │  │              │
    │ • Store      │  │ • Credentials│  │ • Logs       │
    │   Docker     │  │ • Keys       │  │ • Metrics    │
    │   Images     │  └──────────────┘  │ • Alerts     │
    └──────────────┘                    └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
    │ COGNITIVE SEARCH │ │   OPENAI     │ │    SQL DB    │
    │                  │ │              │ │  (Optional)  │
    │ • Index Data     │ │ • GPT-4      │ │              │
    │ • Full-Text      │ │ • Embeddings │ │ • Cache      │
    │   Search         │ │ • Analysis   │ │ • Sessions   │
    └──────────────────┘ └──────────────┘ └──────────────┘
```

## 🔄 Request Flow

```
User Request
    ▼
HTTPS Request (GET/POST)
    ▼
Azure Load Balancer (routing)
    ▼
App Service (Go Backend)
    ▼
┌─────────────────────────────────────┐
│        API Handler Layer            │
│ (request parsing, validation)       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│     Business Logic Layer            │
│ (legal service, analysis)           │
└──────────┬───────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│      Azure Integration Layer        │
│ • Search Service (Cognitive Search) │
│ • OpenAI Service (GPT Analysis)     │
│ • Key Vault (Credentials)           │
└──────────┬───────────────────────────┘
           ▼
JSON Response
    ▼
Client Application
```

## 📦 Container Architecture

```
┌─────────────────────────────────────────────────────┐
│         Docker Image (35MB)                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  FROM alpine:latest (5MB)                           │
│  ├─ ca-certificates                                │
│  └─ annie binary (compiled Go) (30MB)              │
│                                                     │
│  EXPOSE 8080                                        │
│  HEALTHCHECK GET /health                           │
│  CMD ["./annie"]                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
        │
        │ push to ACR
        ▼
┌─────────────────────────────────────────────────────┐
│   Azure Container Registry                          │
│   ├─ annie:latest                                   │
│   ├─ annie:v1.0.0                                   │
│   └─ annie:sha256:abc123...                         │
└─────────────────────────────────────────────────────┘
        │
        │ deploy from ACR
        ▼
┌─────────────────────────────────────────────────────┐
│    App Service (Container Instance)                 │
│                                                     │
│    annie:latest                                     │
│    ├─ Port: 8080                                    │
│    ├─ Memory: 1GB                                   │
│    ├─ CPU: 2 cores                                  │
│    └─ Auto-restart on failure                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────┐
│                    SECURITY LAYER                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. NETWORK SECURITY                                │
│     • Azure Firewall (optional)                     │
│     • Network Security Groups                       │
│     • Private Endpoints (optional)                  │
│     • WAF (Web Application Firewall)                │
│                                                     │
│  2. TRANSPORT SECURITY                              │
│     • HTTPS/TLS 1.3 (enforced)                      │
│     • SSL Certificate (auto-managed)                │
│     • CORS (configurable)                           │
│                                                     │
│  3. CREDENTIAL MANAGEMENT                           │
│     • Azure Key Vault (secret storage)              │
│     • Managed Identity (authentication)             │
│     • API Keys (rotated regularly)                  │
│     • No secrets in code/logs                       │
│                                                     │
│  4. DATA PROTECTION                                 │
│     • Encryption at rest (Azure Storage)            │
│     • Encryption in transit (TLS)                   │
│     • Database encryption (SQL)                     │
│                                                     │
│  5. AUDIT & COMPLIANCE                              │
│     • Azure Audit Logs                              │
│     • Application Insights                          │
│     • Compliance monitoring                         │
│     • Automated alerts                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 📊 Deployment Pipeline (CI/CD)

```
┌─────────────────┐
│  Code Commit    │
│  to Main Branch │
└────────┬────────┘
         │
         ▼
    ┌────────────────────────┐
    │ GitHub Actions         │
    │ (deploy-azure.yml)     │
    └────────┬───────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐     ┌──────────────┐
│ Checkout│     │ Azure Login  │
│ Code    │     │ (CLI)        │
└────┬────┘     └────┬─────────┘
     │               │
     └───────┬───────┘
             ▼
    ┌────────────────────┐
    │ Setup Go 1.21      │
    └────────┬───────────┘
             ▼
    ┌────────────────────┐
    │ Build & Test       │
    │ go build, go test  │
    └────────┬───────────┘
             ▼
    ┌────────────────────────┐
    │ Docker Buildx          │
    │ Multi-platform build   │
    └────────┬───────────────┘
             ▼
    ┌────────────────────────┐
    │ Push to ACR            │
    │ docker push            │
    └────────┬───────────────┘
             ▼
    ┌────────────────────────┐
    │ Deploy to App Service  │
    │ Container Config       │
    └────────┬───────────────┘
             ▼
    ┌────────────────────────┐
    │ Health Check           │
    │ GET /health endpoint   │
    └────────┬───────────────┘
             ▼
    ┌────────────────────────┐
    │ Notifications          │
    │ Success/Failure        │
    └────────────────────────┘
```

## 🚀 Deployment Architecture (One-Click)

```
START: ./deploy.sh
  │
  ├─ 1. Prerequisites Check
  │    ├─ Azure CLI installed
  │    ├─ Docker installed
  │    └─ Git installed
  │
  ├─ 2. Azure Login
  │    └─ Interactive login
  │
  ├─ 3. Create Resource Group
  │    └─ annie-rg-dev in eastus
  │
  ├─ 4. Deploy Infrastructure (Bicep)
  │    ├─ App Service Plan (Premium V2)
  │    ├─ App Service (Web App)
  │    ├─ Container Registry
  │    └─ Key Vault
  │
  ├─ 5. Deploy AI Services (Bicep)
  │    ├─ Cognitive Search
  │    └─ OpenAI
  │
  ├─ 6. Build Docker Image
  │    └─ annie:latest (Multi-stage build)
  │
  ├─ 7. Login to ACR
  │    └─ az acr login
  │
  ├─ 8. Push Image to ACR
  │    └─ docker push acrXXXXXX.azurecr.io/annie:latest
  │
  ├─ 9. Configure App Service
  │    ├─ Docker settings
  │    ├─ Environment variables
  │    └─ App settings
  │
  ├─ 10. Restart App Service
  │     └─ az webapp restart
  │
  ├─ 11. Health Verification
  │      └─ curl /health (retry up to 30 times)
  │
  └─ 12. Display Summary
       └─ Generate DEPLOYMENT_SUMMARY.md

END: Application ready at https://annie-app-dev.azurewebsites.net
```

## 🔄 Data Flow

```
CLIENT REQUEST
    │
    ├─ Docket Lookup
    │  POST /api/v1/docket/lookup
    │  {"case_number": "2024-CV-001", "county": "Dallas"}
    │
    ├─ Handler receives request
    │  ├─ Parse JSON
    │  ├─ Validate input
    │  └─ Call service
    │
    ├─ Legal Service processes
    │  ├─ Build search query
    │  └─ Call Azure Integration
    │
    ├─ Azure Service executes
    │  ├─ Search Cognitive Search for case
    │  │  └─ Cognitive Search returns documents
    │  ├─ Generate summary with OpenAI
    │  │  └─ OpenAI returns analysis
    │  └─ Return combined result
    │
    └─ Response to client
       JSON with case information and AI analysis
```

## 📈 Scaling Architecture

```
Single Instance:
┌──────────────────┐
│   App Service    │
│   (1 instance)   │
│   ~200 req/sec   │
└──────────────────┘

Scaled Out:
┌──────────────────┐
│   Load Balancer  │
│   (Azure ALB)    │
└────────┬─────────┘
         │
    ┌────┴────┬──────┬──────┐
    ▼         ▼      ▼      ▼
┌─────┐  ┌─────┐ ┌─────┐ ┌─────┐
│ AS1 │  │ AS2 │ │ AS3 │ │ AS4 │
│     │  │     │ │     │ │     │
└─────┘  └─────┘ └─────┘ └─────┘
│ 200    │ 200   │ 200   │ 200
└────────────────────────────
Total: 800 req/sec

Auto-Scaling Rules:
- Scale UP when CPU > 80% or Memory > 85%
- Scale DOWN when CPU < 40% and Memory < 60%
- Max 10 instances
- Scale-out time: 2-5 minutes
```

## 💾 Storage Architecture

```
Azure Cognitive Search
├─ Index: caselaw-index
│  ├─ Case number
│  ├─ Case details
│  ├─ Court decisions
│  └─ Legal citations
│
├─ Index: statutes-index
│  ├─ Statute text
│  ├─ Section numbers
│  └─ Amendment history
│
└─ Index: attorneys-index
   ├─ Attorney name
   ├─ Contact info
   └─ Specializations

Azure OpenAI
├─ Deployment: gpt-4-deployment
│  ├─ Model: GPT-4
│  └─ Tokens: Pay-per-use
│
└─ Deployment: embedding-deployment
   ├─ Model: text-embedding-ada-002
   └─ Tokens: Pay-per-use

Azure Key Vault
├─ Secrets:
│  ├─ azure-search-key
│  ├─ azure-openai-key
│  └─ database-password
│
└─ Keys:
   └─ app-encryption-key
```

## ✅ Monitoring & Observability

```
┌─────────────────────────────────────────┐
│      Azure Monitor & Insights           │
├─────────────────────────────────────────┤
│                                         │
│  Application Insights                   │
│  ├─ Request/Response metrics            │
│  ├─ Performance counters                │
│  ├─ Exception tracking                  │
│  ├─ Custom events                       │
│  └─ Dependency tracking                 │
│                                         │
│  Metrics                                │
│  ├─ HTTP requests/second                │
│  ├─ Response time (ms)                  │
│  ├─ CPU usage (%)                       │
│  ├─ Memory usage (%)                    │
│  ├─ Error rate                          │
│  └─ Availability (%)                    │
│                                         │
│  Logs                                   │
│  ├─ Application logs                    │
│  ├─ System logs                         │
│  ├─ Request traces                      │
│  └─ Error logs                          │
│                                         │
│  Alerts                                 │
│  ├─ High error rate                     │
│  ├─ High latency                        │
│  ├─ Low availability                    │
│  └─ Resource exhaustion                 │
│                                         │
└─────────────────────────────────────────┘
```

---

**Architecture designed for**:
- ✅ High availability (99.95% SLA)
- ✅ Scalability (1-10 instances)
- ✅ Security (HTTPS, Key Vault, Managed Identity)
- ✅ Reliability (Health checks, Auto-restart)
- ✅ Observability (Monitoring, Logging, Alerts)
- ✅ Cost efficiency (Auto-scaling, Resource optimization)
