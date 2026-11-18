package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"pfel-elearning/internal/handlers"
	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"
)

func TestListCatalog_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Mocking the GetPublishedCourses query
	fakeTeacherID := uuid.New()
	rows := sqlmock.NewRows([]string{"id_cours", "titre", "description", "est_publie", "date_creation", "id_categorie", "id_enseignant"}).
		AddRow(1, "Go Basics", "Learn Go", true, time.Now(), 1, fakeTeacherID).
		AddRow(2, "React Basics", "Learn React", true, time.Now(), 1, fakeTeacherID)

	mock.ExpectQuery(`SELECT id_cours, titre, description, est_publie, date_creation, id_categorie, id_enseignant FROM cours WHERE est_publie = true`).
		WillReturnRows(rows)

	courseRepo := repository.NewCourseRepository(db)
	courseHandler := &handlers.CourseHandler{CourseRepo: courseRepo}

	r := gin.Default()
	r.GET("/api/cours", courseHandler.ListCatalog)

	req, _ := http.NewRequest(http.MethodGet, "/api/cours", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)
	
	var courses []models.Cours
	err = json.Unmarshal(w.Body.Bytes(), &courses)
	
	assert.NoError(t, err)
	assert.Len(t, courses, 2)
	assert.Equal(t, "Go Basics", courses[0].Titre)
	assert.NoError(t, mock.ExpectationsWereMet())
}
