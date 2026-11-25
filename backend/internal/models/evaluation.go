// File: internal/models/evaluation.go
package models

import "time"

type Evaluation struct {
	IDEvaluation   int       `json:"id_evaluation"`
	IDCours        int       `json:"id_cours"`
	Titre          string    `json:"titre"`
	Instructions   string    `json:"instructions"`
	Bareme         float64   `json:"bareme"`
	TypeEvaluation string    `json:"type_evaluation"`
	PassingScore   *float64  `json:"passing_score,omitempty"`
	DateOuverture  time.Time `json:"date_ouverture"`
	DateCloture    time.Time `json:"date_cloture"`
	NomFichier     string    `json:"nom_fichier"`
	CheminFichier  string    `json:"chemin_fichier"`
}

type Submission struct {
	IDSoumission   int       `json:"id_soumission"`
	IDEvaluation   int       `json:"id_evaluation"`
	IDStudent      string    `json:"id_etudiant"`
	FichierSoumis  string    `json:"fichier_soumis"`
	Note           *float64  `json:"note"`
	Commentaires   string    `json:"commentaires"`
	DateSoumission time.Time `json:"date_soumission"`
	TitreEval      string    `json:"titre_evaluation,omitempty"`
	BaremeEval     float64   `json:"bareme,omitempty"`
	TypeEval       string    `json:"type_evaluation,omitempty"`
}
