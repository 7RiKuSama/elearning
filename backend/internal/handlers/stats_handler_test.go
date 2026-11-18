package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"pfel-elearning/internal/handlers"
	"pfel-elearning/internal/repository"
)

func TestGetPlatformStats_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Mocking the three sequential COUNT queries
	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM utilisateurs`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(150))
	
	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM cours`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(25))
	
	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM soumissions`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(400))

	statsRepo := repository.NewStatsRepository(db)
	statsHandler := &handlers.StatsHandler{StatsRepo: statsRepo}

	r := gin.Default()
	r.GET("/api/statistiques", statsHandler.GetPlatformStats)

	req, _ := http.NewRequest(http.MethodGet, "/api/statistiques", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	assert.Equal(t, float64(150), response["active_users"])
	assert.Equal(t, float64(25), response["total_courses"])
	assert.Equal(t, float64(400), response["total_submissions"])
	assert.NoError(t, mock.ExpectationsWereMet())
}
