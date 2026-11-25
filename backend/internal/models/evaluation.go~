package models

import (
	"time"

	"github.com/google/uuid"
)

type Evaluation struct {
    IDEvaluation   int       `json:"id_evaluation"`
    Titre          string    `json:"titre"`
    Instructions   string    `json:"instructions"`
    Bareme         int       `json:"bareme"`
    DateOuverture  time.Time `json:"date_ouverture"`
    DateCloture    time.Time `json:"date_cloture"`
    NomFichier     string    `json:"nom_fichier,omitempty"`
    CheminFichier  string    `json:"chemin_fichier,omitempty"`
    IDCours        int       `json:"id_cours"`
}

type Soumission struct {
	IDSoumission          int       `json:"id_soumission"`
	FichierSoumis         string    `json:"fichier_soumis"`
	NoteObtenue           float64   `json:"note_obtenue"`
	CommentaireProfesseur string    `json:"commentaire_professeur"`
	DateEnvoi             time.Time `json:"date_envoi"`
	IDEvaluation          int       `json:"id_evaluation"`
	IDEtudiant            uuid.UUID `json:"id_etudiant"`
}
