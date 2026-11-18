package handlers

import (
	"net/http"
	"strconv"

	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CourseHandler struct {
	CourseRepo *repository.CourseRepository
}

func (h *CourseHandler) CreateCourse(c *gin.Context) {
	// 1. Get the user ID from the JWT context middleware
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// 2. Parse the string user ID into a uuid.UUID to match models.Cours
	teacherUUID, err := uuid.Parse(userIDVal.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identifier"})
		return
	}

	var req struct {
		Titre       string `json:"titre" binding:"required"`
		Description string `json:"description" binding:"required"`
		EstPublie   bool   `json:"est_publie"`
		IDCategorie int    `json:"id_categorie" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Build the course object, auto-assigning the creator as the teacher
	course := models.Cours{
		Titre:        req.Titre,
		Description:  req.Description,
		EstPublie:    req.EstPublie,
		IDCategorie:  req.IDCategorie,
		IDEnseignant: teacherUUID,
	}

	if err := h.CourseRepo.CreateCourse(c.Request.Context(), &course); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}

func (h *CourseHandler) ListCatalog(c *gin.Context) {
	courses, err := h.CourseRepo.GetPublishedCourses(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve courses"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

func (h *CourseHandler) UpdateCourse(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
        return
    }

    var req struct {
        Titre       string `json:"titre" binding:"required"`
        Description string `json:"description" binding:"required"`
        EstPublie   bool   `json:"est_publie"`
        IDCategorie int    `json:"id_categorie" binding:"required"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    err = h.CourseRepo.UpdateCourse(c.Request.Context(), id, req.Titre, req.Description, req.EstPublie, req.IDCategorie)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update course"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Course updated successfully"})
}

func (h *CourseHandler) AssignTeacher(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		IdEnseignant string `json:"id_enseignant" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.CourseRepo.AssignTeacher(c.Request.Context(), id, req.IdEnseignant); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign teacher"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Teacher assigned successfully"})
}
