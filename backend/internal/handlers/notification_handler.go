// File: internal/handlers/notification_handler.go
package handlers

import (
	"net/http"
	"strconv"

	"pfel-elearning/internal/repository"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	NotifRepo *repository.NotificationRepository
}

func NewNotificationHandler(notifRepo *repository.NotificationRepository) *NotificationHandler {
	return &NotificationHandler{NotifRepo: notifRepo}
}

func (h *NotificationHandler) List(c *gin.Context) {
	userID, ok := parseAuthorUUID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	items, unreadCount, err := h.NotifRepo.ListByUser(userID, 25)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur chargement notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"unread_count":  unreadCount,
		"notifications": items,
	})
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, ok := parseAuthorUUID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	notifID, err := strconv.Atoi(c.Param("id"))
	if err != nil || notifID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalide"})
		return
	}

	if err := h.NotifRepo.MarkRead(notifID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur mise à jour"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID, ok := parseAuthorUUID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	if err := h.NotifRepo.MarkAllRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur mise à jour"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
