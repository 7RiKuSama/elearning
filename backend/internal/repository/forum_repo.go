package repository

import (
	"context"
	"database/sql"
	"pfel-elearning/internal/models"
)

type ForumRepository struct {
	db *sql.DB
}

func NewForumRepository(db *sql.DB) *ForumRepository {
	return &ForumRepository{db: db}
}

func (r *ForumRepository) CreateMessage(ctx context.Context, m *models.MessageForum) error {
	query := `
		INSERT INTO messages_forum (contenu, id_auteur, id_cours)
		VALUES ($1, $2, $3)
		RETURNING id_message, date_publication`

	return r.db.QueryRowContext(ctx, query, m.Contenu, m.IDAuteur, m.IDCours).Scan(&m.IDMessage, &m.DatePublication)
}

func (r *ForumRepository) GetMessagesByCourse(ctx context.Context, idCours int) ([]models.MessageForum, error) {
	query := `
		SELECT id_message, contenu, date_publication, id_auteur, id_cours
		FROM messages_forum
		WHERE id_cours = $1
		ORDER BY date_publication ASC`

	rows, err := r.db.QueryContext(ctx, query, idCours)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.MessageForum
	for rows.Next() {
		var m models.MessageForum
		if err := rows.Scan(&m.IDMessage, &m.Contenu, &m.DatePublication, &m.IDAuteur, &m.IDCours); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}

	return messages, nil
}

func (r *ForumRepository) DeleteMessage(ctx context.Context, idMessage int) error {
	query := `DELETE FROM messages_forum WHERE id_message = $1`
	_, err := r.db.ExecContext(ctx, query, idMessage)
	return err
}
