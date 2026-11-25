// File: internal/handlers/eval_handler.go
package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EvalHandler struct {
	EvalRepo  *repository.EvaluationRepository
	NotifRepo *repository.NotificationRepository
	DB        *sql.DB
}

type createEvaluationRequest struct {
	Titre          string   `json:"titre" binding:"required"`
	Instructions   string   `json:"instructions"`
	Bareme         float64  `json:"bareme"`
	TypeEvaluation string   `json:"type_evaluation"`
	PassingScore   *float64 `json:"passing_score"`
	DateOuverture  string   `json:"date_ouverture"`
	DateCloture    string   `json:"date_cloture"`
	NomFichier     string   `json:"nom_fichier"`
	CheminFichier  string   `json:"chemin_fichier"`
}

type submitWorkRequest struct {
	FichierSoumis string `json:"fichier_soumis" binding:"required"`
}

type gradeSubmissionRequest struct {
	Note         float64 `json:"note"`
	Commentaires string  `json:"commentaires"`
}

func parseEvalDate(raw string, fallback time.Time) time.Time {
	if raw == "" {
		return fallback
	}
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return t
	}
	if t, err := time.Parse("2006-01-02", raw); err == nil {
		return t
	}
	return fallback
}

func (h *EvalHandler) ListEvaluations(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil || courseID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de cours invalide"})
		return
	}

	list, err := h.EvalRepo.ListByCourse(courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des évaluations"})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *EvalHandler) CreateEvaluation(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil || courseID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de cours invalide"})
		return
	}

	var req createEvaluationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	evalType := req.TypeEvaluation
	if evalType != "quiz" && evalType != "file" {
		evalType = "file"
	}

	bareme := req.Bareme
	if bareme <= 0 {
		bareme = 20
	}

	now := time.Now()
	ev := &models.Evaluation{
		IDCours:        courseID,
		Titre:          req.Titre,
		Instructions:   req.Instructions,
		Bareme:         bareme,
		TypeEvaluation: evalType,
		PassingScore:   req.PassingScore,
		DateOuverture:  parseEvalDate(req.DateOuverture, now),
		DateCloture:    parseEvalDate(req.DateCloture, now.AddDate(0, 0, 7)),
		NomFichier:     req.NomFichier,
		CheminFichier:  req.CheminFichier,
	}

	if err := h.EvalRepo.Create(ev); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création de l'évaluation"})
		return
	}

	if h.NotifRepo != nil {
		_ = h.NotifRepo.NotifyEnrolledStudents(
			courseID,
			"evaluation_published",
			"Nouvelle évaluation publiée",
			"Une évaluation a été ajoutée : "+ev.Titre,
			"/cours/"+strconv.Itoa(courseID),
		)
	}

	c.JSON(http.StatusCreated, ev)
}

func (h *EvalHandler) SubmitWork(c *gin.Context) {
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

	var req submitWorkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sub, err := h.EvalRepo.UpsertSubmission(evalID, studentID, req.FichierSoumis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la soumission"})
		return
	}

	if h.NotifRepo != nil && h.DB != nil {
		var courseID int
		if err := h.DB.QueryRow(`SELECT id_cours FROM evaluations WHERE id_evaluation = $1`, evalID).Scan(&courseID); err == nil && courseID > 0 {
			_ = h.NotifRepo.NotifyCourseTeacher(
				courseID,
				"submission_received",
				"Nouveau rendu déposé",
				"Un étudiant a soumis son travail.",
				"/enseignant/dashboard",
			)
		}
	}

	c.JSON(http.StatusOK, sub)
}

func (h *EvalHandler) ListSubmissions(c *gin.Context) {
	evalID, err := strconv.Atoi(c.Param("id"))
	if err != nil || evalID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID d'évaluation invalide"})
		return
	}

	list, err := h.EvalRepo.ListSubmissionsByEvaluation(evalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des soumissions"})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *EvalHandler) GradeSubmission(c *gin.Context) {
	subID, err := strconv.Atoi(c.Param("id"))
	if err != nil || subID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de soumission invalide"})
		return
	}

	var req gradeSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.EvalRepo.GradeSubmission(subID, req.Note, req.Commentaires); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la notation"})
		return
	}

	if h.NotifRepo != nil && h.DB != nil {
		var studentRaw string
		var courseID sql.NullInt64
		err := h.DB.QueryRow(`
			SELECT s.id_etudiant::text, e.id_cours
			FROM soumissions s
			JOIN evaluations e ON e.id_evaluation = s.id_evaluation
			WHERE s.id_soumission = $1
		`, subID).Scan(&studentRaw, &courseID)
		if err == nil {
			if studentUUID, parseErr := uuid.Parse(studentRaw); parseErr == nil {
				var courseIDPtr *int
				if courseID.Valid {
					v := int(courseID.Int64)
					courseIDPtr = &v
				}
				_ = h.NotifRepo.Create(
					studentUUID,
					courseIDPtr,
					"evaluation_graded",
					"Évaluation notée",
					"Votre rendu a reçu une note.",
					"/mes-notes",
				)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Note enregistrée"})
}

func (h *EvalHandler) GetStudentGrades(c *gin.Context) {
	studentID := extractUserID(c)
	if studentID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	grades, err := h.EvalRepo.GetStudentGrades(studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des notes"})
		return
	}

	c.JSON(http.StatusOK, grades)
}
