// File: internal/repository/stats_repo.go
package repository

import (
	"context"
	"database/sql"
)

type StatsRepository struct {
	db *sql.DB
}

func NewStatsRepository(db *sql.DB) *StatsRepository {
	return &StatsRepository{db: db}
}

func (r *StatsRepository) GetGlobalStats(ctx context.Context) (map[string]interface{}, error) {
	var activeUsers, totalCourses, totalSubmissions int

	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM utilisateurs WHERE statut_actif = true").Scan(&activeUsers)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM cours").Scan(&totalCourses)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM soumissions").Scan(&totalSubmissions)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"active_users":      activeUsers,
		"total_courses":     totalCourses,
		"total_submissions": totalSubmissions,
	}, nil
}
