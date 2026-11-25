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
	if c.DifficultyLevel == "" {
		c.DifficultyLevel = "Beginner"
	}

	query := `
		INSERT INTO cours (
			titre, description, est_publie, date_creation, id_categorie, id_enseignant,
			cover_url, estimated_duration, difficulty_level, prerequisites
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id_cours`

	return r.db.QueryRowContext(ctx, query,
		c.Titre,
		c.Description,
		c.EstPublie,
		c.DateCreation,
		c.IDCategorie,
		c.IDEnseignant,
		c.CoverURL,
		c.EstimatedDuration,
		c.DifficultyLevel,
		c.Prerequisites,
	).Scan(&c.IDCours)
}

func (r *CourseRepository) GetPublishedCourses(ctx context.Context) ([]models.Cours, error) {
	query := `
		SELECT
			id_cours, titre, COALESCE(description, ''), est_publie, date_creation,
			COALESCE(id_categorie, 0), id_enseignant,
			COALESCE(cover_url, ''),
			COALESCE(estimated_duration, ''),
			COALESCE(NULLIF(difficulty_level, ''), 'Beginner'),
			COALESCE(prerequisites, '')
		FROM cours
		WHERE est_publie = true
		ORDER BY id_cours DESC`

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
			&c.CoverURL,
			&c.EstimatedDuration,
			&c.DifficultyLevel,
			&c.Prerequisites,
		)
		if err != nil {
			return nil, err
		}
		courses = append(courses, c)
	}

	return courses, nil
}

func (r *CourseRepository) UpdateCourse(ctx context.Context, c *models.Cours) error {
	if c.DifficultyLevel == "" {
		c.DifficultyLevel = "Beginner"
	}

	query := `
		UPDATE cours
		SET titre = $1,
		    description = $2,
		    est_publie = $3,
		    id_categorie = $4,
		    cover_url = $5,
		    estimated_duration = $6,
		    difficulty_level = $7,
		    prerequisites = $8
		WHERE id_cours = $9`

	_, err := r.db.ExecContext(ctx, query,
		c.Titre,
		c.Description,
		c.EstPublie,
		c.IDCategorie,
		c.CoverURL,
		c.EstimatedDuration,
		c.DifficultyLevel,
		c.Prerequisites,
		c.IDCours,
	)
	return err
}

func (r *CourseRepository) AssignTeacher(ctx context.Context, courseID int, teacherID string) error {
	query := `UPDATE cours SET id_enseignant = $1 WHERE id_cours = $2`
	_, err := r.db.ExecContext(ctx, query, teacherID, courseID)
	return err
}
