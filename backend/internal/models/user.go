package models

import (
	"time"

	"github.com/google/uuid"
)

type Utilisateur struct {
	IDUser          uuid.UUID `json:"id_user"`
	Nom             string    `json:"nom"`
	Prenom          string    `json:"prenom"`
	Email           string    `json:"email"`
	MotDePasse      string    `json:"mot_de_passe"`
	Role            string    `json:"role"`
	StatutActif     bool      `json:"statut_actif"`
	DateInscription time.Time `json:"date_inscription"`
}
