// File: internal/handlers/module_handler.go
package handlers

import (
	"log"
	"net/http"
	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ModuleHandler struct {
	ModuleRepo *repository.ModuleRepository
}

func (h *ModuleHandler) ListModules(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	modules, err := h.ModuleRepo.GetByCourse(c.Request.Context(), courseID)
	if err != nil {
		log.Printf("Error listing modules: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve modules"})
		return
	}

	c.JSON(http.StatusOK, modules)
}

func (h *ModuleHandler) CreateModule(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		Titre          string `json:"titre" binding:"required"`
		Description    string `json:"description"`
		OrdreAffichage int    `json:"ordre_affichage"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mod := models.Module{
		IDCours:        courseID,
		Titre:          req.Titre,
		Description:    req.Description,
		OrdreAffichage: req.OrdreAffichage,
	}

	if err := h.ModuleRepo.Create(c.Request.Context(), &mod); err != nil {
		log.Printf("Error creating module: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create module"})
		return
	}

	c.JSON(http.StatusCreated, mod)
}

func (h *ModuleHandler) UpdateModule(c *gin.Context) {
	modID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	var req struct {
		Titre          string `json:"titre" binding:"required"`
		Description    string `json:"description"`
		OrdreAffichage int    `json:"ordre_affichage"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mod := models.Module{
		IDModule:       modID,
		Titre:          req.Titre,
		Description:    req.Description,
		OrdreAffichage: req.OrdreAffichage,
	}

	if err := h.ModuleRepo.Update(c.Request.Context(), &mod); err != nil {
		log.Printf("Error updating module: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update module"})
		return
	}

	c.JSON(http.StatusOK, mod)
}

func (h *ModuleHandler) DeleteModule(c *gin.Context) {
	modID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	if err := h.ModuleRepo.Delete(c.Request.Context(), modID); err != nil {
		log.Printf("Error deleting module: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete module"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Module deleted successfully"})
}

func (h *ModuleHandler) ReorderModules(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		OrderedIDs []int `json:"ordered_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.ModuleRepo.Reorder(c.Request.Context(), courseID, req.OrderedIDs); err != nil {
		log.Printf("Error reordering modules: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reorder modules"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Modules reordered successfully"})
}

func (h *ModuleHandler) AssignResource(c *gin.Context) {
	resID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resource ID"})
		return
	}

	var req struct {
		IDModule *int `json:"id_module"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.ModuleRepo.AssignResource(c.Request.Context(), resID, req.IDModule); err != nil {
		log.Printf("Error assigning resource to module: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign resource"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource assigned successfully"})
}
