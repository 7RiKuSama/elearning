// File: internal/handlers/enrollment_handler.go
package handlers

import (
	"net/http"
	"strconv"

	"pfel-elearning/internal/repository"

	"github.com/gin-gonic/gin"
)

type EnrollmentHandler struct {
	EnrollRepo *repository.EnrollmentRepository
}

func (h *EnrollmentHandler) Enroll(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		userID, exists = c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
	}
	studentID := userID.(string)

	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID format"})
		return
	}

	if err := h.EnrollRepo.EnrollStudent(c.Request.Context(), studentID, courseID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enroll student (already enrolled?)"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Enrolled successfully"})
}

func (h *EnrollmentHandler) MyEnrollments(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		userID, exists = c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
	}
	studentID := userID.(string)

	enrollments, err := h.EnrollRepo.GetStudentEnrollments(c.Request.Context(), studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve enrollments"})
		return
	}

	c.JSON(http.StatusOK, enrollments)
}

func (h *EnrollmentHandler) GetCourseStudents(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	students, err := h.EnrollRepo.GetEnrolledStudentsByCourse(c.Request.Context(), courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve enrolled students"})
		return
	}

	c.JSON(http.StatusOK, students)
}
