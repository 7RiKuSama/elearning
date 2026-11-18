package repository

import (
	"context"
	"database/sql"
	"pfel-elearning/internal/models"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) CreateCategory(ctx context.Context, c *models.Categorie) error {
	query := `
		INSERT INTO categories (nom, description)
		VALUES ($1, $2)
		RETURNING id_categorie`

	err := r.db.QueryRowContext(ctx, query,
		c.Nom,
		c.Description,
	).Scan(&c.IDCategorie)

	return err
}

func (r *CategoryRepository) GetAllCategories(ctx context.Context) ([]models.Categorie, error) {
	query := `
		SELECT id_categorie, nom, description
		FROM categories`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.Categorie
	for rows.Next() {
		var c models.Categorie
		err := rows.Scan(
			&c.IDCategorie,
			&c.Nom,
			&c.Description,
		)
		if err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}

	return categories, nil
}
