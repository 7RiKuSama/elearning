package handlers_test

import (
	"bytes"
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
	"pfel-elearning/internal/repository"
	"pfel-elearning/pkg/hash"
)

func TestLogin_Success(t *testing.T) {
	// 1. Setup Gin in Test Mode
	gin.SetMode(gin.TestMode)

	// 2. Initialize the Database Mock
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// 3. Prepare Fake Data
	fakePassword := "password123"
	hashedPassword, _ := hash.HashPassword(fakePassword)
	fakeUUID := uuid.New()
	testEmail := "admin@test.com"

	// 4. Mock the exact SQL query executed by GetUserByEmail
	rows := sqlmock.NewRows([]string{"id_user", "nom", "prenom", "email", "mot_de_passe", "role", "statut_actif", "date_inscription"}).
		AddRow(fakeUUID, "Chaouch", "Ghalem", testEmail, hashedPassword, "admin", true, time.Now())

	// We use regex matching for the query to ignore whitespace/newlines
	mock.ExpectQuery(`SELECT id_user, nom, prenom, email, mot_de_passe, role, statut_actif, date_inscription FROM utilisateurs WHERE email = \$1`).
		WithArgs(testEmail).
		WillReturnRows(rows)

	// 5. Initialize the Handler with the Mocked Repository
	userRepo := repository.NewUserRepository(db)
	authHandler := &handlers.AuthHandler{
		UserRepo:  userRepo,
		JWTSecret: "test_secret",
	}

	// 6. Setup the Router
	r := gin.Default()
	r.POST("/api/login", authHandler.Login)

	// 7. Create the HTTP Request
	reqBody, _ := json.Marshal(map[string]string{
		"email":    testEmail,
		"password": fakePassword,
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/login", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	// 8. Record the Response
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// 9. Assertions (The "Pro" part)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "token")
	assert.Contains(t, w.Body.String(), "admin")
	assert.NoError(t, mock.ExpectationsWereMet())
}
