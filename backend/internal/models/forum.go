// File: internal/models/forum.go
package models

import (
	"time"
	"github.com/google/uuid"
)

type MessageForum struct {
	IDMessage       int       `json:"id_message"`
	Contenu         string    `json:"contenu"`
	DatePublication time.Time `json:"date_publication"`
	IDAuteur        uuid.UUID `json:"id_auteur"`
	IDCours         int       `json:"id_cours"`
}
