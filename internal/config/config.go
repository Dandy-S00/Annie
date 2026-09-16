package config

import (
	"os"
)

type Config struct {
	// Azure configuration
	AzureSearchEndpoint  string
	AzureSearchKey       string
	AzureOpenAIEndpoint  string
	AzureOpenAIKey       string
	AzureOpenAIVersion   string
	AzureOpenAIDeployment string

	// Application configuration
	Environment string
	Port        string
	LogLevel    string

	// Feature flags
	EnableCaching bool
}

func LoadConfig() *Config {
	return &Config{
		AzureSearchEndpoint:   os.Getenv("AZURE_SEARCH_ENDPOINT"),
		AzureSearchKey:        os.Getenv("AZURE_SEARCH_KEY"),
		AzureOpenAIEndpoint:   os.Getenv("AZURE_OPENAI_ENDPOINT"),
		AzureOpenAIKey:        os.Getenv("AZURE_OPENAI_KEY"),
		AzureOpenAIVersion:    getEnvOrDefault("AZURE_OPENAI_API_VERSION", "2024-05-01-preview"),
		AzureOpenAIDeployment: os.Getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
		Environment:           getEnvOrDefault("ENVIRONMENT", "development"),
		Port:                  getEnvOrDefault("PORT", "8080"),
		LogLevel:              getEnvOrDefault("LOG_LEVEL", "info"),
		EnableCaching:         getEnvOrDefault("ENABLE_CACHING", "true") == "true",
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
