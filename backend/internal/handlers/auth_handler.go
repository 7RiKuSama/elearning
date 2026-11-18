package handlers

import (
	"net/http"

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

	user, err := h.UserRepo.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !hash.CheckPasswordHash(req.Password, user.MotDePasse) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
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
	MotDePasse string `json:"password" binding:"required,min=6"`
	Role       string `json:"role" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := hash.HashPassword(req.MotDePasse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.Utilisateur{
		Nom:        req.Nom,
		Prenom:     req.Prenom,
		Email:      req.Email,
		MotDePasse: hashedPassword,
		Role:       req.Role, 
	}

	if err := h.UserRepo.CreateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user (email might already exist)"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "id": user.IDUser})
}
