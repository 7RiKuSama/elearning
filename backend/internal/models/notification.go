// File: internal/models/notification.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	IDNotification int       `json:"id_notification"`
	IDDestinataire uuid.UUID `json:"id_destinataire"`
	IDCours        *int      `json:"id_cours,omitempty"`
	TypeNotif      string    `json:"type_notif"`
	Titre          string    `json:"titre"`
	Message        string    `json:"message"`
	Lien           string    `json:"lien"`
	IsRead         bool      `json:"is_read"`
	DateCreation   time.Time `json:"date_creation"`
}
