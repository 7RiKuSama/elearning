package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ResourceHandler struct {
	ResourceRepo *repository.ResourceRepository
}

func (h *ResourceHandler) UploadResource(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		userIDVal, exists = c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
	}

	uploaderUUID, err := uuid.Parse(userIDVal.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identifier"})
		return
	}

	courseIDStr := c.Param("id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		NomFichier    string `json:"nom_fichier" binding:"required"`
		CheminFichier string `json:"chemin_fichier" binding:"required"`
		TypeFichier   string `json:"type_fichier" binding:"required"`
		TailleFichier int64  `json:"taille_fichier"`
		IDModule      *int   `json:"id_module"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res := models.Ressource{
		NomFichier:    req.NomFichier,
		CheminFichier: req.CheminFichier,
		TypeFichier:   req.TypeFichier,
		TailleFichier: req.TailleFichier,
		DateUpload:    time.Now(),
		IDCours:       courseID,
		IDUploader:    uploaderUUID,
		IDModule:      req.IDModule,
	}

	if err := h.ResourceRepo.CreateResource(c.Request.Context(), &res); err != nil {
		log.Printf("Error creating resource: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload resource"})
		return
	}

	c.JSON(http.StatusCreated, res)
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
