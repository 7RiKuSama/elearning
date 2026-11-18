package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"pfel-elearning/internal/handlers"
	"pfel-elearning/internal/repository"
)

func TestEnroll_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	fakeStudentID := uuid.New().String()
	courseID := 1

	// Expect an INSERT statement. Exec expects a Result, not Rows.
	mock.ExpectExec(`INSERT INTO inscriptions \(id_etudiant, id_cours\)`).
		WithArgs(fakeStudentID, courseID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	enrollRepo := repository.NewEnrollmentRepository(db)
	enrollHandler := &handlers.EnrollmentHandler{EnrollRepo: enrollRepo}

	r := gin.Default()
	r.POST("/api/cours/:id/inscription", func(c *gin.Context) {
		c.Set("userID", fakeStudentID)
		enrollHandler.Enroll(c)
	})

	req, _ := http.NewRequest(http.MethodPost, "/api/cours/1/inscription", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Contains(t, w.Body.String(), "Enrolled successfully")
	assert.NoError(t, mock.ExpectationsWereMet())
}
