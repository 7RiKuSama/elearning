// File: internal/handlers/upload_handler.go
package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Aucun fichier reçu"})
		return
	}

	// Crée le dossier ./uploads s'il n'existe pas
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de créer le dossier d'upload"})
		return
	}

	// Génère un nom unique pour éviter les conflits
	ext := filepath.Ext(file.Filename)
	uniqueFileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join(uploadDir, uniqueFileName)

	// Sauvegarde le fichier sur le serveur
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la sauvegarde du fichier"})
		return
	}

	// Retourne l'URL accessible publiquement
	fileURL := fmt.Sprintf("http://localhost:8080/uploads/%s", uniqueFileName)
	c.JSON(http.StatusOK, gin.H{
		"nom_fichier":    file.Filename,
		"chemin_fichier": fileURL,
		"taille_fichier": file.Size,
	})
}
