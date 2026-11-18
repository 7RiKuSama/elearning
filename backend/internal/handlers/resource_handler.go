package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"
)

type ResourceHandler struct {
	ResourceRepo *repository.ResourceRepository
}

func (h *ResourceHandler) UploadResource(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse string user ID into uuid.UUID
	uploaderUUID, err := uuid.Parse(userIDVal.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identifier"})
		return
	}

	var req struct {
		NomFichier    string `json:"nom_fichier" binding:"required"`
		CheminFichier string `json:"chemin_fichier" binding:"required"`
		TypeFichier   string `json:"type_fichier" binding:"required"`
		TailleFichier int64  `json:"taille_fichier"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ressource := models.Ressource{
		IDCours:       courseID,
		NomFichier:    req.NomFichier,
		CheminFichier: req.CheminFichier,
		TypeFichier:   req.TypeFichier,
		TailleFichier: req.TailleFichier,
		DateUpload:    time.Now(),
		IDUploader:    uploaderUUID,
	}

	if err := h.ResourceRepo.CreateResource(c.Request.Context(), &ressource); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resource"})
		return
	}

	c.JSON(http.StatusCreated, ressource)
}

func (h *ResourceHandler) ListResources(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	resources, err := h.ResourceRepo.GetResourcesByCourse(c.Request.Context(), courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve resources"})
		return
	}

	c.JSON(http.StatusOK, resources)
}
