package handlers

import (
	"net/http"
	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ForumHandler struct {
	ForumRepo *repository.ForumRepository
}

func (h *ForumHandler) PostMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	authorID, _ := uuid.Parse(userID.(string))

	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID format"})
		return
	}

	var message models.MessageForum
	if err := c.ShouldBindJSON(&message); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message.IDAuteur = authorID
	message.IDCours = courseID

	if err := h.ForumRepo.CreateMessage(c.Request.Context(), &message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post message"})
		return
	}

	c.JSON(http.StatusCreated, message)
}

func (h *ForumHandler) GetCourseForum(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID format"})
		return
	}

	messages, err := h.ForumRepo.GetMessagesByCourse(c.Request.Context(), courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *ForumHandler) DeleteMessage(c *gin.Context) {
	messageID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID format"})
		return
	}

	if err := h.ForumRepo.DeleteMessage(c.Request.Context(), messageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message deleted"})
}
