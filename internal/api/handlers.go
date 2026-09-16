package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/Dandy-S00/Annie/internal/service"
)

type Handlers struct {
	legalService *service.LegalService
	logger       *zap.Logger
}

func NewHandlers(legalService *service.LegalService, logger *zap.Logger) *Handlers {
	return &Handlers{
		legalService: legalService,
		logger:       logger,
	}
}

func (h *Handlers) RegisterRoutes(router *chi.Mux) {
	router.Route("/api", func(r chi.Router) {
		r.Route("/v1", func(r chi.Router) {
			// Docket lookup
			r.Post("/docket/lookup", h.LookupDocket)

			// Outcome comparison
			r.Post("/outcomes/compare", h.CompareOutcomes)

			// Attorney finder
			r.Post("/attorneys/find", h.FindAttorney)
		})
	})
}

// LookupDocket handles docket lookup requests
func (h *Handlers) LookupDocket(w http.ResponseWriter, r *http.Request) {
	var req service.DocketLookupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("failed to decode request", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if req.CaseNumber == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "case_number required"})
		return
	}

	resp, err := h.legalService.LookupDocket(r.Context(), &req)
	if err != nil {
		h.logger.Error("docket lookup failed", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "lookup failed"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// CompareOutcomes handles outcome comparison requests
func (h *Handlers) CompareOutcomes(w http.ResponseWriter, r *http.Request) {
	var req service.OutcomeComparisonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("failed to decode request", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if req.ChargeType == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "charge_type required"})
		return
	}

	resp, err := h.legalService.CompareOutcomes(r.Context(), &req)
	if err != nil {
		h.logger.Error("outcome comparison failed", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "comparison failed"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// FindAttorney handles attorney finder requests
func (h *Handlers) FindAttorney(w http.ResponseWriter, r *http.Request) {
	var req service.AttorneyFinderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("failed to decode request", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if req.SpecialtyArea == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "specialty_area required"})
		return
	}

	resp, err := h.legalService.FindAttorney(r.Context(), &req)
	if err != nil {
		h.logger.Error("attorney search failed", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "search failed"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
