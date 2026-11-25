package models

import "time"

type RessourceCompletion struct {
	IDCompletion   int       `json:"id_completion"`
	IDUtilisateur  string    `json:"id_utilisateur"`
	IDCours        int       `json:"id_cours"`
	IDRessource    int       `json:"id_ressource"`
	Termine        bool      `json:"termine"`
	DateCompletion time.Time `json:"date_completion"`
}

type CourseCompletionsResponse struct {
	IDCours              int   `json:"id_cours"`
	CompletedResourceIDs []int `json:"completed_resource_ids"`
}

type ToggleCompletionRequest struct {
	Termine *bool `json:"termine,omitempty"`
}

type ToggleCompletionResponse struct {
	IDRessource          int   `json:"id_ressource"`
	IDCours              int   `json:"id_cours"`
	Termine              bool  `json:"termine"`
	CompletedResourceIDs []int `json:"completed_resource_ids"`
}
