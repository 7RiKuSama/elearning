package models

import (
	"time"

	"github.com/google/uuid"
)

type Categorie struct {
	IDCategorie int    `json:"id_categorie"`
	Nom         string `json:"nom"`
	Description string `json:"description"`
}

type Cours struct {
	IDCours      int       `json:"id_cours"`
	Titre        string    `json:"titre"`
	Description  string    `json:"description"`
	EstPublie    bool      `json:"est_publie"`
	DateCreation time.Time `json:"date_creation"`
	IDCategorie  int       `json:"id_categorie"`
	IDEnseignant uuid.UUID `json:"id_enseignant"`
}

type Inscription struct {
	IDEtudiant             uuid.UUID `json:"id_etudiant"`
	IDCours                int       `json:"id_cours"`
	DateInscription        time.Time `json:"date_inscription"`
	ProgressionPourcentage float64   `json:"progression_pourcentage"`
}
