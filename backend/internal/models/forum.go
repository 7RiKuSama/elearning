// File: internal/models/forum.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type ForumCategory string

const (
	ForumCategoryQuestion     ForumCategory = "question"
	ForumCategoryAnnouncement ForumCategory = "announcement"
	ForumCategoryResource     ForumCategory = "resource"
)

type MessageForum struct {
	IDMessage       int       `json:"id_message"`
	Contenu         string    `json:"contenu"`
	DatePublication time.Time `json:"date_publication"`
	IDAuteur        uuid.UUID `json:"id_auteur"`
	IDCours         int       `json:"id_cours"`
}

type ForumReply struct {
	IDReponse       int          `json:"id_reponse"`
	IDMessage       int          `json:"id_message"`
	ParentIDReponse *int         `json:"parent_id_reponse,omitempty"`
	IDAuteur        uuid.UUID    `json:"id_auteur"`
	AuteurNom       string       `json:"auteur_nom,omitempty"`
	AuteurRole      string       `json:"auteur_role,omitempty"`
	Contenu         string       `json:"contenu"`
	IsBestAnswer    bool         `json:"is_best_answer"`
	DatePublication time.Time    `json:"date_publication"`
	Children        []ForumReply `json:"children,omitempty"`
}

type ForumThread struct {
	IDMessage       int           `json:"id_message"`
	IDCours         int           `json:"id_cours"`
	IDAuteur        uuid.UUID     `json:"id_auteur"`
	AuteurNom       string        `json:"auteur_nom,omitempty"`
	AuteurRole      string        `json:"auteur_role,omitempty"`
	Titre           string        `json:"titre"`
	Contenu         string        `json:"contenu"`
	Categorie       ForumCategory `json:"categorie"`
	IsResolved      bool          `json:"is_resolved"`
	AcceptedReplyID *int          `json:"accepted_reply_id,omitempty"`
	ReplyCount      int           `json:"reply_count"`
	DatePublication time.Time     `json:"date_publication"`
	Replies         []ForumReply  `json:"replies,omitempty"`
}
