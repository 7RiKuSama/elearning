package repository

import (
	"context"
	"database/sql"
	"time"
	"pfel-elearning/internal/models"
)

type EvaluationRepository struct {
	db *sql.DB
}

func NewEvaluationRepository(db *sql.DB) *EvaluationRepository {
	return &EvaluationRepository{db: db}
}

func (r *EvaluationRepository) GetEvaluationsByCourse(ctx context.Context, courseID int) ([]models.Evaluation, error) {
	query := `
		SELECT id_evaluation, id_cours, titre, instructions, bareme, date_ouverture, date_cloture, nom_fichier, chemin_fichier 
		FROM evaluations 
		WHERE id_cours = $1
	`
	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var evals []models.Evaluation
	for rows.Next() {
		var ev models.Evaluation
		var nomFichier, cheminFichier sql.NullString

		if err := rows.Scan(
			&ev.IDEvaluation, 
			&ev.IDCours, 
			&ev.Titre, 
			&ev.Instructions, 
			&ev.Bareme, 
			&ev.DateOuverture, 
			&ev.DateCloture, 
			&nomFichier, 
			&cheminFichier,
		); err != nil {
			return nil, err
		}

		if nomFichier.Valid {
			ev.NomFichier = nomFichier.String
		}
		if cheminFichier.Valid {
			ev.CheminFichier = cheminFichier.String
		}

		evals = append(evals, ev)
	}
	return evals, nil
}

func (r *EvaluationRepository) GetSubmissionsByEvaluation(ctx context.Context, evalID int) ([]models.Soumission, error) {
	query := `SELECT id_soumission, id_evaluation, id_etudiant, fichier_soumis, note_obtenue, commentaire_professeur, date_envoi FROM soumissions WHERE id_evaluation = $1`
	rows, err := r.db.QueryContext(ctx, query, evalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []models.Soumission
	for rows.Next() {
		var s models.Soumission
		if err := rows.Scan(&s.IDSoumission, &s.IDEvaluation, &s.IDEtudiant, &s.FichierSoumis, &s.NoteObtenue, &s.CommentaireProfesseur, &s.DateEnvoi); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	return subs, nil
}

func (r *EvaluationRepository) GradeSubmission(ctx context.Context, submissionID int, note float64, commentaires string) error {
	query := `UPDATE soumissions SET note_obtenue = $1, commentaire_professeur = $2 WHERE id_soumission = $3`
	_, err := r.db.ExecContext(ctx, query, note, commentaires, submissionID)
	return err
}

func (r *EvaluationRepository) GetStudentGrades(ctx context.Context, studentID string) ([]map[string]interface{}, error) {
	query := `
		SELECT s.id_soumission, s.note_obtenue, s.commentaire_professeur, s.date_envoi, 
			   e.id_evaluation, e.titre AS eval_titre, e.bareme, c.titre AS cours_titre
		FROM soumissions s
		JOIN evaluations e ON s.id_evaluation = e.id_evaluation
		JOIN cours c ON e.id_cours = c.id_cours
		WHERE s.id_etudiant = $1
	`
	rows, err := r.db.QueryContext(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var idSoumission int
		var note *float64
		var commentaires string
		var dateSoumission time.Time
		var idEvaluation int
		var evalTitre string
		var bareme float64
		var coursTitre string

		if err := rows.Scan(&idSoumission, &note, &commentaires, &dateSoumission, &idEvaluation, &evalTitre, &bareme, &coursTitre); err != nil {
			return nil, err
		}

		results = append(results, map[string]interface{}{
			"id_soumission":   idSoumission,
			"id_evaluation":   idEvaluation,
			"eval_titre":      evalTitre,
			"cours_titre":     coursTitre,
			"bareme":          bareme,
			"note":            note,
			"commentaires":    commentaires,
			"date_soumission": dateSoumission,
		})
	}
	return results, nil
}

func (r *EvaluationRepository) CreateEvaluation(ctx context.Context, eval *models.Evaluation) error {
	query := `
		INSERT INTO evaluations (id_cours, titre, instructions, bareme, date_ouverture, date_cloture, nom_fichier, chemin_fichier)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id_evaluation
	`
	var nomFichier, cheminFichier interface{} = nil, nil
	if eval.NomFichier != "" {
		nomFichier = eval.NomFichier
	}
	if eval.CheminFichier != "" {
		cheminFichier = eval.CheminFichier
	}

	return r.db.QueryRowContext(ctx, query,
		eval.IDCours,
		eval.Titre,
		eval.Instructions,
		eval.Bareme,
		eval.DateOuverture,
		eval.DateCloture,
		nomFichier,
		cheminFichier,
	).Scan(&eval.IDEvaluation)
}

func (r *EvaluationRepository) SubmitWork(ctx context.Context, sub *models.Soumission) error {
	query := `
		INSERT INTO soumissions (id_evaluation, id_etudiant, fichier_soumis, date_envoi)
		VALUES ($1, $2, $3, $4)
		RETURNING id_soumission
	`
	return r.db.QueryRowContext(ctx, query,
		sub.IDEvaluation,
		sub.IDEtudiant,
		sub.FichierSoumis,
		sub.DateEnvoi,
	).Scan(&sub.IDSoumission)
}
