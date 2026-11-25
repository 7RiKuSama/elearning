package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"pfel-elearning/internal/models"
)

var ErrResourceNotFound = errors.New("resource not found")

type CompletionRepository struct {
	db *sql.DB
}

func NewCompletionRepository(db *sql.DB) *CompletionRepository {
	return &CompletionRepository{db: db}
}

// GetCourseIDByResource resolves the parent course ID on the server.
// Update this join if your schema links ressources -> chapitres/modules -> cours.
func (r *CompletionRepository) GetCourseIDByResource(ctx context.Context, resourceID int) (int, error) {
	var courseID int
	err := r.db.QueryRowContext(
		ctx,
		`SELECT id_cours FROM ressources WHERE id_ressource = $1`,
		resourceID,
	).Scan(&courseID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrResourceNotFound
		}
		return 0, err
	}
	return courseID, nil
}

// ListCompletedResourceIDs returns completed resource IDs for a user within a given course.
func (r *CompletionRepository) ListCompletedResourceIDs(ctx context.Context, userID string, courseID int) ([]int, error) {
	rows, err := r.db.QueryContext(
		ctx,
		`SELECT rc.id_ressource
		 FROM ressource_completions rc
		 JOIN ressources r ON r.id_ressource = rc.id_ressource
		 WHERE rc.id_utilisateur = $1
		   AND r.id_cours = $2
		   AND rc.termine = TRUE
		 ORDER BY rc.id_ressource ASC`,
		userID,
		courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]int, 0)
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ids, nil
}

// ToggleCompletion flips or explicitly sets termine for (userID, resourceID) and returns updated state.
func (r *CompletionRepository) ToggleCompletion(
	ctx context.Context,
	userID string,
	resourceID int,
	explicitTermine *bool,
) (*models.ToggleCompletionResponse, error) {
	courseID, err := r.GetCourseIDByResource(ctx, resourceID)
	if err != nil {
		return nil, err
	}

	var currentTermine bool
	err = r.db.QueryRowContext(
		ctx,
		`SELECT termine FROM ressource_completions WHERE id_utilisateur = $1 AND id_ressource = $2`,
		userID,
		resourceID,
	).Scan(&currentTermine)

	var nextTermine bool
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			if explicitTermine != nil {
				nextTermine = *explicitTermine
			} else {
				nextTermine = true
			}
		} else {
			return nil, err
		}
	} else {
		if explicitTermine != nil {
			nextTermine = *explicitTermine
		} else {
			nextTermine = !currentTermine
		}
	}

	now := time.Now().UTC()
	_, err = r.db.ExecContext(
		ctx,
		`INSERT INTO ressource_completions (id_utilisateur, id_ressource, termine, date_completion)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (id_utilisateur, id_ressource)
		 DO UPDATE SET
		   termine = EXCLUDED.termine,
		   date_completion = EXCLUDED.date_completion`,
		userID,
		resourceID,
		nextTermine,
		now,
	)
	if err != nil {
		return nil, err
	}

	completedIDs, err := r.ListCompletedResourceIDs(ctx, userID, courseID)
	if err != nil {
		return nil, err
	}

	return &models.ToggleCompletionResponse{
		IDRessource:          resourceID,
		IDCours:              courseID,
		Termine:              nextTermine,
		CompletedResourceIDs: completedIDs,
	}, nil
}
