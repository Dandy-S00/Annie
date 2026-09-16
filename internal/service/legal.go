package service

import (
	"context"
	"fmt"
	"strings"

	"go.uber.org/zap"
)

type LegalService struct {
	azureService *AzureService
	logger       *zap.Logger
}

func NewLegalService(azureService *AzureService, logger *zap.Logger) *LegalService {
	return &LegalService{
		azureService: azureService,
		logger:       logger,
	}
}

type DocketLookupRequest struct {
	CaseNumber string `json:"case_number"`
	County     string `json:"county"`
}

type DocketLookupResponse struct {
	CaseNumber  string `json:"case_number"`
	County      string `json:"county"`
	Status      string `json:"status"`
	FiledDate   string `json:"filed_date"`
	Description string `json:"description"`
}

type OutcomeComparisonRequest struct {
	ChargeType string `json:"charge_type"`
	Context    string `json:"context"`
}

type OutcomeComparisonResponse struct {
	ChargeType    string                    `json:"charge_type"`
	SimilarCases  []SimilarCase             `json:"similar_cases"`
	Analysis      string                    `json:"analysis"`
	CommonOutcomes map[string]OutcomeStats `json:"common_outcomes"`
}

type SimilarCase struct {
	CaseID     string `json:"case_id"`
	ChargeType string `json:"charge_type"`
	Outcome    string `json:"outcome"`
	Citation   string `json:"citation"`
}

type OutcomeStats struct {
	Percentage float64 `json:"percentage"`
	Count      int     `json:"count"`
}

type AttorneyFinderRequest struct {
	SpecialtyArea string `json:"specialty_area"`
	County        string `json:"county"`
}

type AttorneyFinderResponse struct {
	Attorneys []AttorneyInfo `json:"attorneys"`
	Message   string         `json:"message"`
}

type AttorneyInfo struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Website string `json:"website"`
	Area    string `json:"area"`
}

// LookupDocket retrieves case information and court docket details
func (s *LegalService) LookupDocket(ctx context.Context, req *DocketLookupRequest) (*DocketLookupResponse, error) {
	s.logger.Info("looking up docket", zap.String("case_number", req.CaseNumber), zap.String("county", req.County))

	// Search for case law
	query := fmt.Sprintf("case number: %s county: %s", req.CaseNumber, req.County)
	results, err := s.azureService.SearchCaseLaw(ctx, query, "caselaw-index")
	if err != nil {
		s.logger.Error("failed to search case law", zap.Error(err))
		return nil, err
	}

	// Generate summary using AI
	systemPrompt := `You are a Texas legal assistant. Provide a brief summary of the case based on available information.
Include case status, important dates, and case description.`
	
	userMessage := fmt.Sprintf("Summarize the following case information: %v", results)
	
	summary, err := s.azureService.GenerateCompletion(ctx, systemPrompt, userMessage)
	if err != nil {
		s.logger.Error("failed to generate summary", zap.Error(err))
		summary = "Unable to generate AI summary"
	}

	return &DocketLookupResponse{
		CaseNumber:  req.CaseNumber,
		County:      req.County,
		Status:      "Active",
		FiledDate:   "2024-01-01", // Placeholder - would be extracted from actual search results
		Description: summary,
	}, nil
}

// CompareOutcomes analyzes similar case outcomes
func (s *LegalService) CompareOutcomes(ctx context.Context, req *OutcomeComparisonRequest) (*OutcomeComparisonResponse, error) {
	s.logger.Info("comparing outcomes", zap.String("charge_type", req.ChargeType))

	// Search for similar cases
	query := fmt.Sprintf("charge type: %s", req.ChargeType)
	results, err := s.azureService.SearchCaseLaw(ctx, query, "caselaw-index")
	if err != nil {
		s.logger.Error("failed to search cases", zap.Error(err))
		return nil, err
	}

	// Generate analysis using AI
	systemPrompt := `You are a Texas legal analyst specializing in criminal defense.
Analyze the similar cases and provide insights on common outcomes and patterns.
Be objective and provide statistical information when possible.`
	
	userMessage := fmt.Sprintf("Analyze outcomes for %s charges based on these cases: %v\nContext: %s", 
		req.ChargeType, results, req.Context)
	
	analysis, err := s.azureService.GenerateCompletion(ctx, systemPrompt, userMessage)
	if err != nil {
		s.logger.Error("failed to generate analysis", zap.Error(err))
		analysis = "Unable to generate AI analysis"
	}

	// Parse results into similar cases
	similarCases := parseSimilarCases(results)

	// Generate outcome statistics
	outcomeStats := generateOutcomeStats(similarCases)

	return &OutcomeComparisonResponse{
		ChargeType:     req.ChargeType,
		SimilarCases:   similarCases,
		Analysis:       analysis,
		CommonOutcomes: outcomeStats,
	}, nil
}

// FindAttorney searches for qualified attorneys in the specified area
func (s *LegalService) FindAttorney(ctx context.Context, req *AttorneyFinderRequest) (*AttorneyFinderResponse, error) {
	s.logger.Info("finding attorneys", zap.String("specialty", req.SpecialtyArea), zap.String("county", req.County))

	// Search for attorney information
	query := fmt.Sprintf("attorney %s specialist %s", req.SpecialtyArea, req.County)
	results, err := s.azureService.SearchStatutes(ctx, query, "attorneys-index")
	if err != nil {
		s.logger.Error("failed to search attorneys", zap.Error(err))
		// Return with message if search fails
		return &AttorneyFinderResponse{
			Attorneys: []AttorneyInfo{},
			Message:   "Unable to find attorneys at this time. Please contact the State Bar of Texas.",
		}, nil
	}

	// Generate list of attorneys
	systemPrompt := `You are a Texas legal resource assistant. 
Extract attorney information from the provided data.
Format as JSON with name, phone, email, website, and area of specialization.`
	
	userMessage := fmt.Sprintf("Extract attorney information from: %v", results)
	
	responseText, err := s.azureService.GenerateCompletion(ctx, systemPrompt, userMessage)
	if err != nil {
		s.logger.Error("failed to generate attorney list", zap.Error(err))
		responseText = "No attorney data available"
	}

	// Parse attorney information
	attorneys := parseAttorneys(responseText)

	message := fmt.Sprintf("Found %d attorney(s) in %s specializing in %s", 
		len(attorneys), req.County, req.SpecialtyArea)

	return &AttorneyFinderResponse{
		Attorneys: attorneys,
		Message:   message,
	}, nil
}

// Helper functions
func parseSimilarCases(results []string) []SimilarCase {
	var cases []SimilarCase
	// Parse results and extract case information
	// This would be expanded with actual parsing logic
	for i, result := range results {
		if len(result) > 0 {
			cases = append(cases, SimilarCase{
				CaseID:     fmt.Sprintf("CASE-%d", i),
				ChargeType: "Criminal",
				Outcome:    "Disposition Pending",
				Citation:   result,
			})
		}
	}
	return cases
}

func generateOutcomeStats(cases []SimilarCase) map[string]OutcomeStats {
	stats := make(map[string]OutcomeStats)
	outcomeCount := make(map[string]int)
	
	for _, c := range cases {
		outcomeCount[c.Outcome]++
	}

	total := len(cases)
	for outcome, count := range outcomeCount {
		percentage := float64(count) / float64(total) * 100
		stats[outcome] = OutcomeStats{
			Percentage: percentage,
			Count:      count,
		}
	}

	return stats
}

func parseAttorneys(data string) []AttorneyInfo {
	var attorneys []AttorneyInfo
	
	// Simple parsing - would be enhanced with actual JSON parsing
	if strings.Contains(data, "attorney") {
		attorneys = append(attorneys, AttorneyInfo{
			Name:    "Legal Professional",
			Phone:   "(512) 555-0100",
			Email:   "contact@txbar.com",
			Website: "https://www.texasbar.com",
			Area:    "Criminal Defense",
		})
	}

	return attorneys
}
