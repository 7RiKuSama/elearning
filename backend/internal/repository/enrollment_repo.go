// File: internal/repository/enrollment_repo.go
package repository

import (
	"context"
	"database/sql"
	"pfel-elearning/internal/models"
	"time"
)

type EnrollmentRepository struct {
	db *sql.DB
}

func NewEnrollmentRepository(db *sql.DB) *EnrollmentRepository {
	return &EnrollmentRepository{db: db}
}

func (r *EnrollmentRepository) EnrollStudent(ctx context.Context, idEtudiant string, idCours int) error {
	query := `
		INSERT INTO inscriptions (id_etudiant, id_cours)
		VALUES ($1, $2)`
	_, err := r.db.ExecContext(ctx, query, idEtudiant, idCours)
	return err
}

func (r *EnrollmentRepository) GetStudentEnrollments(ctx context.Context, idEtudiant string) ([]models.Inscription, error) {
	query := `
		SELECT id_etudiant, id_cours, date_inscription, progression_pourcentage
		FROM inscriptions
		WHERE id_etudiant = $1`

	rows, err := r.db.QueryContext(ctx, query, idEtudiant)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enrollments []models.Inscription
	for rows.Next() {
		var i models.Inscription
		if err := rows.Scan(&i.IDEtudiant, &i.IDCours, &i.DateInscription, &i.ProgressionPourcentage); err != nil {
			return nil, err
		}
		enrollments = append(enrollments, i)
	}
	return enrollments, nil
}

func (r *EnrollmentRepository) GetEnrolledStudentsByCourse(ctx context.Context, courseID int) ([]map[string]interface{}, error) {
	query := `
		SELECT u.id_user, u.nom, u.prenom, u.email, i.date_inscription, i.progression_pourcentage
		FROM inscriptions i
		JOIN utilisateurs u ON i.id_etudiant = u.id_user
		WHERE i.id_cours = $1
	`
	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []map[string]interface{}
	for rows.Next() {
		var idUser string
		var nom, prenom, email string
		var dateInscription time.Time
		var progression int

		if err := rows.Scan(&idUser, &nom, &prenom, &email, &dateInscription, &progression); err != nil {
			return nil, err
		}

		students = append(students, map[string]interface{}{
			"id_user":                 idUser,
			"nom":                     nom,
			"prenom":                  prenom,
			"email":                   email,
			"date_inscription":        dateInscription,
			"progression_pourcentage": progression,
		})
	}
	return students, nil
}
