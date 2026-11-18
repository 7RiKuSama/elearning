package repository

import (
	"context"
	"database/sql"
	"pfel-elearning/internal/models"
)

type CourseRepository struct {
	db *sql.DB
}

func NewCourseRepository(db *sql.DB) *CourseRepository {
	return &CourseRepository{db: db}
}

func (r *CourseRepository) CreateCourse(ctx context.Context, c *models.Cours) error {
	query := `
		INSERT INTO cours (titre, description, est_publie, date_creation, id_categorie, id_enseignant)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id_cours`

	err := r.db.QueryRowContext(ctx, query,
		c.Titre,
		c.Description,
		c.EstPublie,
		c.DateCreation,
		c.IDCategorie,
		c.IDEnseignant,
	).Scan(&c.IDCours)

	return err
}

func (r *CourseRepository) GetPublishedCourses(ctx context.Context) ([]models.Cours, error) {
	query := `
		SELECT id_cours, titre, description, est_publie, date_creation, id_categorie, id_enseignant
		FROM cours
		WHERE est_publie = true`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []models.Cours
	for rows.Next() {
		var c models.Cours
		err := rows.Scan(
			&c.IDCours,
			&c.Titre,
			&c.Description,
			&c.EstPublie,
			&c.DateCreation,
			&c.IDCategorie,
			&c.IDEnseignant,
		)
		if err != nil {
			return nil, err
		}
		courses = append(courses, c)
	}

	return courses, nil
}

func (r *CourseRepository) UpdateCourse(ctx context.Context, courseID int, titre, description string, estPublie bool, idCategorie int) error {
    query := `UPDATE cours SET titre = $1, description = $2, est_publie = $3, id_categorie = $4 WHERE id_cours = $5`
    _, err := r.db.ExecContext(ctx, query, titre, description, estPublie, idCategorie, courseID)
    return err
}

func (r *CourseRepository) AssignTeacher(ctx context.Context, courseID int, teacherID string) error {
	query := `UPDATE cours SET id_enseignant = $1 WHERE id_cours = $2`
	_, err := r.db.ExecContext(ctx, query, teacherID, courseID)
	return err
}
