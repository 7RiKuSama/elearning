// File: internal/models/module.go
package models

import "time"

type Module struct {
	IDModule       int       `json:"id_module"`
	IDCours        int       `json:"id_cours"`
	Titre          string    `json:"titre"`
	Description    string    `json:"description"`
	OrdreAffichage int       `json:"ordre_affichage"`
	DateCreation   time.Time `json:"date_creation"`
}
