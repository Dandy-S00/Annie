package service

import (
	"context"
	"fmt"

	"github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/search/azsearch"
	"go.uber.org/zap"

	"github.com/Dandy-S00/Annie/internal/config"
)

type AzureService struct {
	searchClient  *azsearch.Client
	openAIClient  *azopenai.Client
	config        *config.Config
	logger        *zap.Logger
}

func NewAzureService(cfg *config.Config, logger *zap.Logger) (*AzureService, error) {
	// Initialize Azure Credential
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure credentials: %w", err)
	}

	// Initialize Azure Search Client
	searchClient, err := azsearch.NewClient(cfg.AzureSearchEndpoint, azsearch.KeyCredential{APIKey: cfg.AzureSearchKey})
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure Search client: %w", err)
	}

	// Initialize Azure OpenAI Client
	openAIClient, err := azopenai.NewClientWithKeyCredential(cfg.AzureOpenAIEndpoint, azopenai.KeyCredential{APIKey: cfg.AzureOpenAIKey}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure OpenAI client: %w", err)
	}

	return &AzureService{
		searchClient: searchClient,
		openAIClient: openAIClient,
		config:       cfg,
		logger:       logger,
	}, nil
}

func (s *AzureService) SearchStatutes(ctx context.Context, query string, indexName string) ([]string, error) {
	opts := &azsearch.SearchOptions{
		Select: to.SliceOfPtrs("metadata_storage_path", "content"),
	}

	results, err := s.searchClient.Search(ctx, indexName, query, opts)
	if err != nil {
		s.logger.Error("search failed", zap.Error(err), zap.String("query", query))
		return nil, err
	}

	var documents []string
	for results.More() {
		result, err := results.NextResult(ctx)
		if err != nil {
			s.logger.Error("failed to get search result", zap.Error(err))
			continue
		}
		documents = append(documents, fmt.Sprintf("%v", result.Document))
	}

	return documents, nil
}

func (s *AzureService) SearchCaseLaw(ctx context.Context, query string, indexName string) ([]string, error) {
	return s.SearchStatutes(ctx, query, indexName)
}

func (s *AzureService) GenerateCompletion(ctx context.Context, systemPrompt, userMessage string) (string, error) {
	resp, err := s.openAIClient.GetChatCompletions(ctx, &azopenai.ChatCompletionsOptions{
		DeploymentID: s.config.AzureOpenAIDeployment,
		Messages: []azopenai.ChatCompletionMessage{
			{
				Role:    to.Ptr(azopenai.ChatCompletionRoleSystem),
				Content: to.Ptr(systemPrompt),
			},
			{
				Role:    to.Ptr(azopenai.ChatCompletionRoleUser),
				Content: to.Ptr(userMessage),
			},
		},
		Temperature:     to.Ptr[float32](0.7),
		TopP:            to.Ptr[float32](1.0),
		MaxTokens:       to.Ptr[int32](2000),
	}, nil)

	if err != nil {
		s.logger.Error("failed to generate completion", zap.Error(err))
		return "", err
	}

	if len(resp.Choices) > 0 && resp.Choices[0].Message.Content != nil {
		return *resp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("no completion generated")
}

func (s *AzureService) HealthCheck(ctx context.Context) error {
	// Test OpenAI connection
	_, err := s.openAIClient.GetChatCompletions(ctx, &azopenai.ChatCompletionsOptions{
		DeploymentID: s.config.AzureOpenAIDeployment,
		Messages: []azopenai.ChatCompletionMessage{
			{
				Role:    to.Ptr(azopenai.ChatCompletionRoleUser),
				Content: to.Ptr("Hello"),
			},
		},
		MaxTokens: to.Ptr[int32](10),
	}, nil)

	return err
}
