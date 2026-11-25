package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"
)

type CompletionHandler struct {
	repo *repository.CompletionRepository
}

func NewCompletionHandler(repo *repository.CompletionRepository) *CompletionHandler {
	return &CompletionHandler{repo: repo}
}

// GetCourseCompletions handles GET /api/cours/{id}/completions
func (h *CompletionHandler) GetCourseCompletions(w http.ResponseWriter, r *http.Request) {
	userID, ok := userIDFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "Authentification requise")
		return
	}

	courseID, err := parsePositiveID(r.PathValue("id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "Identifiant de cours invalide")
		return
	}

	ids, err := h.repo.ListCompletedResourceIDs(r.Context(), userID, courseID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Impossible de charger les completions")
		return
	}

	writeJSON(w, http.StatusOK, models.CourseCompletionsResponse{
		IDCours:              courseID,
		CompletedResourceIDs: ids,
	})
}

// ToggleResourceCompletion handles POST /api/ressources/{id}/toggle-completion
func (h *CompletionHandler) ToggleResourceCompletion(w http.ResponseWriter, r *http.Request) {
	userID, ok := userIDFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "Authentification requise")
		return
	}

	resourceID, err := parsePositiveID(r.PathValue("id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "Identifiant de ressource invalide")
		return
	}

	var req models.ToggleCompletionRequest
	if r.Body != nil {
		dec := json.NewDecoder(r.Body)
		if err := dec.Decode(&req); err != nil && !errors.Is(err, io.EOF) {
			writeJSONError(w, http.StatusBadRequest, "Corps de requête JSON invalide")
			return
		}
	}

	resp, err := h.repo.ToggleCompletion(r.Context(), userID, resourceID, req.Termine)
	if err != nil {
		if errors.Is(err, repository.ErrResourceNotFound) {
			writeJSONError(w, http.StatusNotFound, "Ressource introuvable")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Impossible de mettre à jour la completion")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func parsePositiveID(raw string) (int, error) {
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}

// Adapt this helper to read the authenticated user ID set by your JWT/session middleware.
func userIDFromRequest(r *http.Request) (string, bool) {
	val := r.Context().Value("user_id")
	switch v := val.(type) {
	case string:
		trimmed := strings.TrimSpace(v)
		return trimmed, trimmed != ""
	case int:
		return strconv.Itoa(v), v > 0
	case int64:
		return strconv.FormatInt(v, 10), v > 0
	case float64:
		if v <= 0 {
			return "", false
		}
		return strconv.FormatInt(int64(v), 10), true
	default:
		return "", false
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
