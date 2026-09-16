param location string = resourceGroup().location
param projectName string = 'annie'
param environment string = 'dev'

var searchServiceName = '${projectName}-search-${environment}'
var openAIName = '${projectName}-openai-${environment}'

// Azure Cognitive Search
resource cognitiveSearch 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchServiceName
  location: location
  sku: {
    name: 'standard'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
  }
}

// Azure OpenAI (requires allowlisting)
resource openAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: openAIName
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: openAIName
    publicNetworkAccess: 'Enabled'
  }
}

// Outputs
output searchEndpoint string = 'https://${cognitiveSearch.name}.search.windows.net'
output searchServiceName string = cognitiveSearch.name
output openAIEndpoint string = openAI.properties.endpoint
output openAIName string = openAI.name
