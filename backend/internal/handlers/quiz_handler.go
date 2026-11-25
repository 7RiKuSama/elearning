// File: internal/handlers/quiz_handler.go
package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"
)

type QuizHandler struct {
	Repo *repository.QuizRepository
}

func NewQuizHandler(repo *repository.QuizRepository) *QuizHandler {
	return &QuizHandler{Repo: repo}
}

func extractUserID(c *gin.Context) string {
	for _, key := range []string{"user_id", "id_user", "userID"} {
		if val, exists := c.Get(key); exists {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				return s
			}
		}
	}
	return ""
}

func extractRole(c *gin.Context) string {
	for _, key := range []string{"role", "user_role"} {
		if val, exists := c.Get(key); exists {
			if s, ok := val.(string); ok {
				return strings.ToLower(strings.TrimSpace(s))
			}
		}
	}
	return ""
}

// GET /api/evaluations/:id/quiz
func (h *QuizHandler) GetQuiz(c *gin.Context) {
	evalID, err := strconv.Atoi(c.Param("id"))
	if err != nil || evalID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID d'évaluation invalide"})
		return
	}

	ctx := c.Request.Context()
	userID := extractUserID(c)
	role := extractRole(c)
	revealAnswers := role == "enseignant" || role == "admin"

	if !revealAnswers && userID != "" {
		hasAttempt, err := h.Repo.HasStudentAttempt(ctx, evalID, userID)
		if err == nil && hasAttempt {
			revealAnswers = true
		}
	}

	questions, err := h.Repo.GetQuestionsByEvaluation(ctx, evalID, revealAnswers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du chargement du quiz"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"questions": questions})
}

// POST /api/evaluations/:id/quiz
func (h *QuizHandler) SaveQuiz(c *gin.Context) {
	evalID, err := strconv.Atoi(c.Param("id"))
	if err != nil || evalID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID d'évaluation invalide"})
		return
	}

	var req models.SaveQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Questions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Au moins une question est requise"})
		return
	}

	for _, q := range req.Questions {
		if strings.TrimSpace(q.Prompt) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Chaque question doit avoir un énoncé"})
			return
		}
		if strings.TrimSpace(q.QuestionType) != "true_false" && len(q.Options) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Chaque QCM doit contenir au moins 2 options"})
			return
		}
	}

	if err := h.Repo.SaveQuestions(c.Request.Context(), evalID, req.Questions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'enregistrement du quiz"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz enregistré avec succès"})
}

// POST /api/evaluations/:id/quiz/submit
func (h *QuizHandler) SubmitQuiz(c *gin.Context) {
	evalID, err := strconv.Atoi(c.Param("id"))
	if err != nil || evalID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID d'évaluation invalide"})
		return
	}

	studentID := extractUserID(c)
	if studentID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req models.SubmitQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format de réponses invalide"})
		return
	}

	res, err := h.Repo.GradeAndSubmitAttempt(c.Request.Context(), evalID, studentID, req.Answers)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrEvaluationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "Évaluation introuvable"})
		case errors.Is(err, repository.ErrEmptyQuizQuestions):
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ce quiz ne contient aucune question"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la correction automatique du quiz"})
		}
		return
	}

	c.JSON(http.StatusOK, res)
}
