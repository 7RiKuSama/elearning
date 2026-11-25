// File: internal/handlers/auth_handler.go
package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"
	"log"

	"github.com/gin-gonic/gin"
	"pfel-elearning/internal/models"
	"pfel-elearning/internal/repository"
	"pfel-elearning/pkg/hash"
	"pfel-elearning/pkg/jwt"
)

type AuthHandler struct {
	UserRepo  *repository.UserRepository
	JWTSecret string
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type loginResponse struct {
	Token string `json:"token"`
	Role  string `json:"role"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalizedEmail := strings.TrimSpace(strings.ToLower(req.Email))
	user, err := h.UserRepo.GetUserByEmail(c.Request.Context(), normalizedEmail)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !hash.CheckPasswordHash(req.Password, user.MotDePasse) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.StatutActif {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is suspended"})
		return
	}

	token, err := jwt.GenerateToken(user.IDUser.String(), user.Role, h.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, loginResponse{
		Token: token,
		Role:  user.Role,
	})
}

type registerRequest struct {
	Nom        string `json:"nom" binding:"required"`
	Prenom     string `json:"prenom" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	MotDePasse string `json:"password" binding:"required,min=8"`
	Role       string `json:"role"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	nom := strings.TrimSpace(req.Nom)
	prenom := strings.TrimSpace(req.Prenom)
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if nom == "" || prenom == "" || email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nom, prénom and email are required"})
		return
	}

	// Public registration only permits student or teacher accounts; never admin
	role := strings.ToLower(strings.TrimSpace(req.Role))
	if role == "" {
		role = "etudiant"
	}
	if role != "etudiant" && role != "enseignant" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Public registration is only allowed for 'etudiant' or 'enseignant' roles",
		})
		return
	}

	hashedPassword, err := hash.HashPassword(req.MotDePasse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.Utilisateur{
		Nom:              nom,
		Prenom:           prenom,
		Email:            email,
		MotDePasse:       hashedPassword,
		Role:             role,
		StatutActif:      true,
		DateInscription:  time.Now(),
		NotifEvaluations: true,
		NotifSubmissions: true,
		NotifGrades:      true,
		NotifForum:       true,
	}

	if err := h.UserRepo.CreateUser(c.Request.Context(), user); err != nil {
		log.Printf("CreateUser failed: %v", err)
		if strings.Contains(strings.ToLower(err.Error()), "duplicate key") || strings.Contains(err.Error(), "23505") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "id": user.IDUser})
}

func extractUserIDFromContext(c *gin.Context) (string, bool) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		userIDVal, exists = c.Get("userID")
		if !exists {
			return "", false
		}
	}

	userIDStr, ok := userIDVal.(string)
	if !ok || userIDStr == "" {
		return "", false
	}

	return userIDStr, true
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userIDStr, ok := extractUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.UserRepo.GetUserByID(c.Request.Context(), userIDStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.MotDePasse = ""
	c.JSON(http.StatusOK, user)
}

type updateProfileRequest struct {
	Nom              string `json:"nom"`
	Prenom           string `json:"prenom"`
	Bio              string `json:"bio"`
	AvatarURL        string `json:"avatar_url"`
	NotifEvaluations *bool  `json:"notif_evaluations"`
	NotifSubmissions *bool  `json:"notif_submissions"`
	NotifGrades      *bool  `json:"notif_grades"`
	NotifForum       *bool  `json:"notif_forum"`
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userIDStr, ok := extractUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.UserRepo.GetUserByID(c.Request.Context(), userIDStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if nom := strings.TrimSpace(req.Nom); nom != "" {
		user.Nom = nom
	}
	if prenom := strings.TrimSpace(req.Prenom); prenom != "" {
		user.Prenom = prenom
	}
	user.Bio = strings.TrimSpace(req.Bio)
	user.AvatarURL = strings.TrimSpace(req.AvatarURL)

	if req.NotifEvaluations != nil {
		user.NotifEvaluations = *req.NotifEvaluations
	}
	if req.NotifSubmissions != nil {
		user.NotifSubmissions = *req.NotifSubmissions
	}
	if req.NotifGrades != nil {
		user.NotifGrades = *req.NotifGrades
	}
	if req.NotifForum != nil {
		user.NotifForum = *req.NotifForum
	}

	updated, err := h.UserRepo.UpdateProfile(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	updated.MotDePasse = ""
	c.JSON(http.StatusOK, updated)
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userIDStr, ok := extractUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.UserRepo.GetUserByID(c.Request.Context(), userIDStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !hash.CheckPasswordHash(req.CurrentPassword, user.MotDePasse) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	hashedPassword, err := hash.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
		return
	}

	if err := h.UserRepo.UpdatePassword(c.Request.Context(), userIDStr, hashedPassword); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}
