// File: internal/handlers/stats_handler.go
package handlers

import (
	"net/http"
	"pfel-elearning/internal/repository"

	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	StatsRepo *repository.StatsRepository
}

func (h *StatsHandler) GetPlatformStats(c *gin.Context) {
	stats, err := h.StatsRepo.GetGlobalStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
