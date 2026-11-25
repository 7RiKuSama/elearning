// File: internal/repository/quiz_repo.go
package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"strings"

	"pfel-elearning/internal/models"
)

var ErrEvaluationNotFound = errors.New("evaluation not found")
var ErrEmptyQuizQuestions = errors.New("quiz has no questions")

type QuizQuestionGradingRow struct {
	IDQuestion   int
	CorrectIndex int
	Points       float64
	Explanation  string
}

type QuizRepository struct {
	DB *sql.DB
}

func NewQuizRepository(db *sql.DB) *QuizRepository {
	return &QuizRepository{DB: db}
}

func (r *QuizRepository) HasStudentAttempt(ctx context.Context, evalID int, studentID string) (bool, error) {
	if strings.TrimSpace(studentID) == "" {
		return false, nil
	}
	var count int
	err := r.DB.QueryRowContext(
		ctx,
		`SELECT COUNT(*) FROM quiz_attempts WHERE id_evaluation = $1 AND id_etudiant = $2`,
		evalID,
		studentID,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *QuizRepository) GetQuestionsByEvaluation(
	ctx context.Context,
	evalID int,
	revealAnswers bool,
) ([]models.QuizQuestion, error) {
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id_question, id_evaluation, question_type, prompt, options_json,
		       correct_index, points, explanation, ordre_affichage
		FROM quiz_questions
		WHERE id_evaluation = $1
		ORDER BY ordre_affichage ASC, id_question ASC
	`, evalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	questions := make([]models.QuizQuestion, 0)
	for rows.Next() {
		var q models.QuizQuestion
		var optionsBytes []byte
		var correctIdx int
		var explanation string

		if err := rows.Scan(
			&q.IDQuestion,
			&q.IDEvaluation,
			&q.QuestionType,
			&q.Prompt,
			&optionsBytes,
			&correctIdx,
			&q.Points,
			&explanation,
			&q.OrdreAffichage,
		); err != nil {
			return nil, err
		}

		if err := json.Unmarshal(optionsBytes, &q.Options); err != nil {
			q.Options = []string{}
		}

		if revealAnswers {
			idxCopy := correctIdx
			q.CorrectIndex = &idxCopy
			q.Explanation = explanation
		}

		questions = append(questions, q)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return questions, nil
}

func (r *QuizRepository) SaveQuestions(
	ctx context.Context,
	evalID int,
	questions []models.QuizQuestion,
) error {
	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `
		UPDATE evaluations
		SET type_evaluation = 'quiz'
		WHERE id_evaluation = $1
	`, evalID); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		DELETE FROM quiz_questions
		WHERE id_evaluation = $1
	`, evalID); err != nil {
		return err
	}

	for i, q := range questions {
		qType := strings.TrimSpace(q.QuestionType)
		if qType != "true_false" {
			qType = "mcq"
		}

		options := q.Options
		if qType == "true_false" {
			options = []string{"Vrai", "Faux"}
		}

		correctIdx := 0
		if q.CorrectIndex != nil && *q.CorrectIndex >= 0 && *q.CorrectIndex < len(options) {
			correctIdx = *q.CorrectIndex
		}

		pts := q.Points
		if pts <= 0 {
			pts = 1
		}

		optionsJSON, err := json.Marshal(options)
		if err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO quiz_questions (
				id_evaluation, question_type, prompt, options_json,
				correct_index, points, explanation, ordre_affichage
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`,
			evalID,
			qType,
			strings.TrimSpace(q.Prompt),
			optionsJSON,
			correctIdx,
			pts,
			strings.TrimSpace(q.Explanation),
			i+1,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *QuizRepository) GradeAndSubmitAttempt(
	ctx context.Context,
	evalID int,
	studentID string,
	answers map[int]int,
) (*models.QuizSubmissionResponse, error) {
	var bareme float64
	err := r.DB.QueryRowContext(ctx, `
		SELECT bareme FROM evaluations WHERE id_evaluation = $1
	`, evalID).Scan(&bareme)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEvaluationNotFound
		}
		return nil, err
	}

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id_question, correct_index, points, explanation
		FROM quiz_questions
		WHERE id_evaluation = $1
		ORDER BY ordre_affichage ASC, id_question ASC
	`, evalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var gradingRows []QuizQuestionGradingRow
	var totalPoints float64
	for rows.Next() {
		var item QuizQuestionGradingRow
		if err := rows.Scan(&item.IDQuestion, &item.CorrectIndex, &item.Points, &item.Explanation); err != nil {
			return nil, err
		}
		totalPoints += item.Points
		gradingRows = append(gradingRows, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(gradingRows) == 0 {
		return nil, ErrEmptyQuizQuestions
	}

	var earnedPoints float64
	results := make([]models.QuizQuestionResult, 0, len(gradingRows))

	for _, q := range gradingRows {
		chosen, answered := answers[q.IDQuestion]
		isCorrect := answered && chosen == q.CorrectIndex
		var ptsEarned float64
		if isCorrect {
			ptsEarned = q.Points
			earnedPoints += q.Points
		}

		results = append(results, models.QuizQuestionResult{
			IDQuestion:    q.IDQuestion,
			IsCorrect:     isCorrect,
			SelectedIndex: chosen,
			CorrectIndex:  q.CorrectIndex,
			PointsEarned:  ptsEarned,
			Explanation:   q.Explanation,
		})
	}

	rawScore := bareme
	if totalPoints > 0 {
		rawScore = (earnedPoints / totalPoints) * bareme
	}
	finalScore := math.Round(rawScore*100) / 100

	answersJSON, err := json.Marshal(answers)
	if err != nil {
		return nil, err
	}

	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO quiz_attempts (id_evaluation, id_etudiant, answers_json, score, max_score, submitted_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (id_evaluation, id_etudiant)
		DO UPDATE SET
			answers_json = EXCLUDED.answers_json,
			score = EXCLUDED.score,
			max_score = EXCLUDED.max_score,
			submitted_at = NOW()
	`, evalID, studentID, answersJSON, finalScore, bareme); err != nil {
		return nil, err
	}

	var existingSubID int
	err = tx.QueryRowContext(ctx, `
		SELECT id_soumission FROM soumissions
		WHERE id_evaluation = $1 AND id_etudiant = $2
		LIMIT 1
	`, evalID, studentID).Scan(&existingSubID)

	if errors.Is(err, sql.ErrNoRows) {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO soumissions (id_evaluation, id_etudiant, fichier_soumis, note_obtenue, commentaire_professeur, date_envoi)
			VALUES ($1, $2, 'quiz://auto-graded', $3, 'Correction automatique du quiz', NOW())
		`, evalID, studentID, finalScore)
	} else if err == nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE soumissions
			SET note_obtenue = $1, date_envoi = NOW()
			WHERE id_soumission = $2
		`, finalScore, existingSubID)
	}
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &models.QuizSubmissionResponse{
		Score:    finalScore,
		MaxScore: bareme,
		Results:  results,
	}, nil
}
