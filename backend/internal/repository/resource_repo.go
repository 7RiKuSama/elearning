package repository

import (
	"context"
	"database/sql"
	"pfel-elearning/internal/models"
)

type ResourceRepository struct {
	db *sql.DB
}

func NewResourceRepository(db *sql.DB) *ResourceRepository {
	return &ResourceRepository{db: db}
}

func (r *ResourceRepository) CreateResource(ctx context.Context, ressource *models.Ressource) error {
	query := `
		INSERT INTO ressources (nom_fichier, chemin_fichier, type_fichier, taille_fichier, date_upload, id_cours, id_uploader, id_module)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id_ressource`

	var moduleVal interface{} = nil
	if ressource.IDModule != nil {
		moduleVal = *ressource.IDModule
	}

	err := r.db.QueryRowContext(ctx, query,
		ressource.NomFichier,
		ressource.CheminFichier,
		ressource.TypeFichier,
		ressource.TailleFichier,
		ressource.DateUpload,
		ressource.IDCours,
		ressource.IDUploader,
		moduleVal,
	).Scan(&ressource.IDRessource)

	return err
}

func (r *ResourceRepository) GetResourcesByCourse(ctx context.Context, courseID int) ([]models.Ressource, error) {
	query := `
		SELECT id_ressource, nom_fichier, chemin_fichier, type_fichier, taille_fichier, date_upload, id_cours, id_uploader, id_module
		FROM ressources 
		WHERE id_cours = $1`

	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resources []models.Ressource
	for rows.Next() {
		var res models.Ressource
		var idModule sql.NullInt64

		if err := rows.Scan(
			&res.IDRessource,
			&res.NomFichier,
			&res.CheminFichier,
			&res.TypeFichier,
			&res.TailleFichier,
			&res.DateUpload,
			&res.IDCours,
			&res.IDUploader,
			&idModule,
		); err != nil {
			return nil, err
		}

		if idModule.Valid {
			val := int(idModule.Int64)
			res.IDModule = &val
		}

		resources = append(resources, res)
	}
	return resources, nil
}
