package models

import (
	"time"

	"github.com/google/uuid"
)

type Utilisateur struct {
	IDUser           uuid.UUID `json:"id_user"`
	Nom              string    `json:"nom"`
	Prenom           string    `json:"prenom"`
	Email            string    `json:"email"`
	MotDePasse       string    `json:"mot_de_passe"`
	Role             string    `json:"role"`
	StatutActif      bool      `json:"statut_actif"`
	DateInscription  time.Time `json:"date_inscription"`
	AvatarURL        string    `json:"avatar_url"`
	Bio              string    `json:"bio"`
	NotifEvaluations bool      `json:"notif_evaluations"`
	NotifSubmissions bool      `json:"notif_submissions"`
	NotifGrades      bool      `json:"notif_grades"`
	NotifForum       bool      `json:"notif_forum"`
}
