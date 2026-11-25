// File: internal/repository/module_repo.go
package repository

import (
	"context"
	"database/sql"
	"pfel-elearning/internal/models"
)

type ModuleRepository struct {
	db *sql.DB
}

func NewModuleRepository(db *sql.DB) *ModuleRepository {
	return &ModuleRepository{db: db}
}

func (r *ModuleRepository) GetByCourse(ctx context.Context, courseID int) ([]models.Module, error) {
	query := `
		SELECT id_module, id_cours, titre, COALESCE(description, ''), ordre_affichage, date_creation
		FROM modules
		WHERE id_cours = $1
		ORDER BY ordre_affichage ASC, id_module ASC
	`
	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var modules []models.Module
	for rows.Next() {
		var m models.Module
		if err := rows.Scan(
			&m.IDModule,
			&m.IDCours,
			&m.Titre,
			&m.Description,
			&m.OrdreAffichage,
			&m.DateCreation,
		); err != nil {
			return nil, err
		}
		modules = append(modules, m)
	}
	return modules, nil
}

func (r *ModuleRepository) Create(ctx context.Context, m *models.Module) error {
	if m.OrdreAffichage <= 0 {
		var maxOrder int
		_ = r.db.QueryRowContext(
			ctx,
			`SELECT COALESCE(MAX(ordre_affichage), 0) FROM modules WHERE id_cours = $1`,
			m.IDCours,
		).Scan(&maxOrder)
		m.OrdreAffichage = maxOrder + 1
	}

	query := `
		INSERT INTO modules (id_cours, titre, description, ordre_affichage)
		VALUES ($1, $2, $3, $4)
		RETURNING id_module, date_creation
	`
	return r.db.QueryRowContext(
		ctx,
		query,
		m.IDCours,
		m.Titre,
		m.Description,
		m.OrdreAffichage,
	).Scan(&m.IDModule, &m.DateCreation)
}

func (r *ModuleRepository) Update(ctx context.Context, m *models.Module) error {
	query := `
		UPDATE modules
		SET titre = $1, description = $2, ordre_affichage = $3
		WHERE id_module = $4
	`
	_, err := r.db.ExecContext(ctx, query, m.Titre, m.Description, m.OrdreAffichage, m.IDModule)
	return err
}

func (r *ModuleRepository) Delete(ctx context.Context, moduleID int) error {
	query := `DELETE FROM modules WHERE id_module = $1`
	_, err := r.db.ExecContext(ctx, query, moduleID)
	return err
}

func (r *ModuleRepository) Reorder(ctx context.Context, courseID int, orderedIDs []int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for idx, modID := range orderedIDs {
		if _, err := tx.ExecContext(
			ctx,
			`UPDATE modules SET ordre_affichage = $1 WHERE id_module = $2 AND id_cours = $3`,
			idx+1,
			modID,
			courseID,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *ModuleRepository) AssignResource(ctx context.Context, resourceID int, moduleID *int) error {
	query := `UPDATE ressources SET id_module = $1 WHERE id_ressource = $2`
	_, err := r.db.ExecContext(ctx, query, moduleID, resourceID)
	return err
}
