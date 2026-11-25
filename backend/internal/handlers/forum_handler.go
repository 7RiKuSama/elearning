// File: internal/handlers/forum_handler.go
package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ForumHandler struct {
	ForumRepo *repository.ForumRepository
}

func NewForumHandler(forumRepo *repository.ForumRepository) *ForumHandler {
	return &ForumHandler{ForumRepo: forumRepo}
}

type createThreadRequest struct {
	Titre     string `json:"titre" binding:"required"`
	Contenu   string `json:"contenu" binding:"required"`
	Categorie string `json:"categorie"`
}

type createReplyRequest struct {
	Contenu         string `json:"contenu" binding:"required"`
	ParentIDReponse *int   `json:"parent_id_reponse"`
}

type setResolvedRequest struct {
	IsResolved bool `json:"is_resolved"`
}

func parseAuthorUUID(c *gin.Context) (uuid.UUID, bool) {
	for _, key := range []string{"userID", "user_id", "id_user", "sub"} {
		if val, ok := c.Get(key); ok {
			switch v := val.(type) {
			case uuid.UUID:
				if v != uuid.Nil {
					return v, true
				}
			case string:
				if parsed, err := uuid.Parse(strings.TrimSpace(v)); err == nil && parsed != uuid.Nil {
					return parsed, true
				}
			}
		}
	}
	return uuid.Nil, false
}

func isTeacherOrAdmin(c *gin.Context) bool {
	for _, key := range []string{"role", "user_role", "userRole"} {
		if val, ok := c.Get(key); ok {
			role := strings.ToLower(strings.TrimSpace(anyToString(val)))
			if role == "enseignant" || role == "admin" {
				return true
			}
		}
	}
	return false
}

func anyToString(v any) string {
	switch x := v.(type) {
	case string:
		return x
	case int:
		return strconv.Itoa(x)
	case int64:
		return strconv.FormatInt(x, 10)
	default:
		return ""
	}
}

func (h *ForumHandler) ListThreads(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil || courseID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de cours invalide"})
		return
	}

	category := strings.ToLower(strings.TrimSpace(c.Query("category")))
	threads, err := h.ForumRepo.ListThreadsByCourse(courseID, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du chargement des discussions"})
		return
	}

	c.JSON(http.StatusOK, threads)
}

func (h *ForumHandler) GetThread(c *gin.Context) {
	threadID, err := strconv.Atoi(c.Param("threadId"))
	if err != nil || threadID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de discussion invalide"})
		return
	}

	th, err := h.ForumRepo.GetThreadWithReplies(threadID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Discussion introuvable"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du chargement de la discussion"})
		return
	}

	c.JSON(http.StatusOK, th)
}

func (h *ForumHandler) CreateThread(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil || courseID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de cours invalide"})
		return
	}

	authorID, ok := parseAuthorUUID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req createThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat := models.ForumCategory(strings.ToLower(strings.TrimSpace(req.Categorie)))
	if cat != models.ForumCategoryQuestion && cat != models.ForumCategoryAnnouncement && cat != models.ForumCategoryResource {
		cat = models.ForumCategoryQuestion
	}

	th, err := h.ForumRepo.CreateThread(
		courseID,
		authorID,
		strings.TrimSpace(req.Titre),
		strings.TrimSpace(req.Contenu),
		cat,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création du fil"})
		return
	}

	c.JSON(http.StatusCreated, th)
}

func (h *ForumHandler) CreateReply(c *gin.Context) {
	threadID, err := strconv.Atoi(c.Param("threadId"))
	if err != nil || threadID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de discussion invalide"})
		return
	}

	authorID, ok := parseAuthorUUID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req createReplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rep, err := h.ForumRepo.CreateReply(
		threadID,
		authorID,
		strings.TrimSpace(req.Contenu),
		req.ParentIDReponse,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'envoi de la réponse"})
		return
	}

	c.JSON(http.StatusCreated, rep)
}

func (h *ForumHandler) MarkBestAnswer(c *gin.Context) {
	if !isTeacherOrAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Seul l'enseignant peut valider la meilleure réponse"})
		return
	}

	threadID, err := strconv.Atoi(c.Param("threadId"))
	replyID, err2 := strconv.Atoi(c.Param("replyId"))
	if err != nil || threadID <= 0 || err2 != nil || replyID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Paramètres invalides"})
		return
	}

	th, err := h.ForumRepo.MarkBestAnswer(threadID, replyID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Réponse introuvable dans cette discussion"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la validation de la réponse"})
		return
	}

	c.JSON(http.StatusOK, th)
}

func (h *ForumHandler) SetResolved(c *gin.Context) {
	if !isTeacherOrAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Seul l'enseignant peut modifier le statut résolu"})
		return
	}

	threadID, err := strconv.Atoi(c.Param("threadId"))
	if err != nil || threadID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de discussion invalide"})
		return
	}

	var req setResolvedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	th, err := h.ForumRepo.ToggleResolved(threadID, req.IsResolved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour du statut"})
		return
	}

	c.JSON(http.StatusOK, th)
}

func (h *ForumHandler) DeleteThread(c *gin.Context) {
	threadID, err := strconv.Atoi(c.Param("threadId"))
	if err != nil || threadID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de discussion invalide"})
		return
	}

	if err := h.ForumRepo.DeleteThread(threadID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la suppression"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true})
}
