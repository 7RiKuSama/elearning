package models

import (
	"time"

	"github.com/google/uuid"
)

type Ressource struct {
	IDRessource   int       `json:"id_ressource"`
	NomFichier    string    `json:"nom_fichier"`
	CheminFichier string    `json:"chemin_fichier"`
	TypeFichier   string    `json:"type_fichier"`
	TailleFichier int64     `json:"taille_fichier"`
	DateUpload    time.Time `json:"date_upload"`
	IDCours       int       `json:"id_cours"`
	IDUploader    uuid.UUID `json:"id_uploader"`
	IDModule      *int      `json:"id_module"`
}
