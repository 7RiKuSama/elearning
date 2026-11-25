// File: internal/repository/evaluation_repo.go
package repository

import (
	"database/sql"
	"time"

	"pfel-elearning/internal/models"
)

type EvaluationRepository struct {
	DB *sql.DB
}

func NewEvaluationRepository(db *sql.DB) *EvaluationRepository {
	return &EvaluationRepository{DB: db}
}

func (r *EvaluationRepository) Create(ev *models.Evaluation) error {
	if ev.TypeEvaluation == "" {
		ev.TypeEvaluation = "file"
	}

	query := `
		INSERT INTO evaluations (
			id_cours, titre, instructions, bareme, type_evaluation, passing_score,
			date_ouverture, date_cloture, nom_fichier, chemin_fichier
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id_evaluation, COALESCE(type_evaluation, 'file')
	`
	return r.DB.QueryRow(
		query,
		ev.IDCours,
		ev.Titre,
		ev.Instructions,
		ev.Bareme,
		ev.TypeEvaluation,
		ev.PassingScore,
		ev.DateOuverture,
		ev.DateCloture,
		ev.NomFichier,
		ev.CheminFichier,
	).Scan(&ev.IDEvaluation, &ev.TypeEvaluation)
}

func (r *EvaluationRepository) ListByCourse(courseID int) ([]models.Evaluation, error) {
	query := `
		SELECT
			id_evaluation,
			id_cours,
			titre,
			instructions,
			bareme,
			COALESCE(type_evaluation, 'file'),
			passing_score,
			date_ouverture,
			date_cloture,
			COALESCE(nom_fichier, ''),
			COALESCE(chemin_fichier, '')
		FROM evaluations
		WHERE id_cours = $1
		ORDER BY id_evaluation ASC
	`
	rows, err := r.DB.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.Evaluation, 0)
	for rows.Next() {
		var ev models.Evaluation
		var passing sql.NullFloat64
		if err := rows.Scan(
			&ev.IDEvaluation,
			&ev.IDCours,
			&ev.Titre,
			&ev.Instructions,
			&ev.Bareme,
			&ev.TypeEvaluation,
			&passing,
			&ev.DateOuverture,
			&ev.DateCloture,
			&ev.NomFichier,
			&ev.CheminFichier,
		); err != nil {
			return nil, err
		}
		if passing.Valid {
			val := passing.Float64
			ev.PassingScore = &val
		}
		list = append(list, ev)
	}
	return list, rows.Err()
}

func (r *EvaluationRepository) UpsertSubmission(evalID int, studentID string, filePath string) (*models.Submission, error) {
	query := `
		INSERT INTO soumissions (id_evaluation, id_etudiant, fichier_soumis, date_envoi)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (id_evaluation, id_etudiant)
		DO UPDATE SET fichier_soumis = EXCLUDED.fichier_soumis, date_envoi = NOW()
		RETURNING id_soumission, id_evaluation, id_etudiant::text, COALESCE(fichier_soumis, ''), note_obtenue, COALESCE(commentaire_professeur, ''), date_envoi
	`
	var sub models.Submission
	var note sql.NullFloat64
	var sentAt sql.NullTime
	err := r.DB.QueryRow(query, evalID, studentID, filePath).Scan(
		&sub.IDSoumission,
		&sub.IDEvaluation,
		&sub.IDStudent,
		&sub.FichierSoumis,
		&note,
		&sub.Commentaires,
		&sentAt,
	)
	if err != nil {
		return nil, err
	}
	if note.Valid {
		val := note.Float64
		sub.Note = &val
	}
	if sentAt.Valid {
		sub.DateSoumission = sentAt.Time
	} else {
		sub.DateSoumission = time.Now()
	}
	return &sub, nil
}

func (r *EvaluationRepository) ListSubmissionsByEvaluation(evalID int) ([]models.Submission, error) {
	query := `
		SELECT
			id_soumission,
			id_evaluation,
			id_etudiant::text,
			COALESCE(fichier_soumis, ''),
			note_obtenue,
			COALESCE(commentaire_professeur, ''),
			date_envoi
		FROM soumissions
		WHERE id_evaluation = $1
		ORDER BY date_envoi DESC NULLS LAST, id_soumission DESC
	`
	rows, err := r.DB.Query(query, evalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.Submission, 0)
	for rows.Next() {
		var sub models.Submission
		var note sql.NullFloat64
		var sentAt sql.NullTime
		if err := rows.Scan(
			&sub.IDSoumission,
			&sub.IDEvaluation,
			&sub.IDStudent,
			&sub.FichierSoumis,
			&note,
			&sub.Commentaires,
			&sentAt,
		); err != nil {
			return nil, err
		}
		if note.Valid {
			val := note.Float64
			sub.Note = &val
		}
		if sentAt.Valid {
			sub.DateSoumission = sentAt.Time
		}
		list = append(list, sub)
	}
	return list, rows.Err()
}

func (r *EvaluationRepository) GradeSubmission(subID int, note float64, comments string) error {
	query := `
		UPDATE soumissions
		SET note_obtenue = $1, commentaire_professeur = $2
		WHERE id_soumission = $3
	`
	_, err := r.DB.Exec(query, note, comments, subID)
	return err
}

func (r *EvaluationRepository) GetStudentGrades(studentID string) ([]models.Submission, error) {
	query := `
		SELECT
			s.id_soumission,
			s.id_evaluation,
			s.id_etudiant::text,
			COALESCE(s.fichier_soumis, ''),
			s.note_obtenue,
			COALESCE(s.commentaire_professeur, ''),
			s.date_envoi,
			COALESCE(e.titre, ''),
			COALESCE(e.bareme::float8, 20::float8),
			COALESCE(e.type_evaluation, 'file')
		FROM soumissions s
		LEFT JOIN evaluations e ON e.id_evaluation = s.id_evaluation
		WHERE s.id_etudiant::text = $1
		ORDER BY s.date_envoi DESC NULLS LAST, s.id_soumission DESC
	`
	rows, err := r.DB.Query(query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.Submission, 0)
	for rows.Next() {
		var sub models.Submission
		var note sql.NullFloat64
		var sentAt sql.NullTime
		if err := rows.Scan(
			&sub.IDSoumission,
			&sub.IDEvaluation,
			&sub.IDStudent,
			&sub.FichierSoumis,
			&note,
			&sub.Commentaires,
			&sentAt,
			&sub.TitreEval,
			&sub.BaremeEval,
			&sub.TypeEval,
		); err != nil {
			return nil, err
		}
		if note.Valid {
			val := note.Float64
			sub.Note = &val
		}
		if sentAt.Valid {
			sub.DateSoumission = sentAt.Time
		}
		list = append(list, sub)
	}
	return list, rows.Err()
}
