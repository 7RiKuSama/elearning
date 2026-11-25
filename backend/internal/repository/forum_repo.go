// File: internal/repository/forum_repo.go
package repository

import (
	"database/sql"
	"errors"

	"pfel-elearning/internal/models"

	"github.com/google/uuid"
)

type ForumRepository struct {
	DB *sql.DB
}

func NewForumRepository(db *sql.DB) *ForumRepository {
	return &ForumRepository{DB: db}
}

func (r *ForumRepository) ListThreadsByCourse(courseID int, category string) ([]models.ForumThread, error) {
	query := `
		SELECT
			m.id_message,
			m.id_cours,
			m.id_auteur,
			COALESCE(NULLIF(TRIM(CONCAT(u.prenom, ' ', u.nom)), ''), u.email, 'Utilisateur') AS auteur_nom,
			COALESCE(u.role::text, 'etudiant') AS auteur_role,
			COALESCE(NULLIF(TRIM(m.titre), ''), LEFT(m.contenu, 80)) AS titre,
			m.contenu,
			COALESCE(m.categorie, 'question') AS categorie,
			COALESCE(m.is_resolved, FALSE) AS is_resolved,
			m.accepted_reply_id,
			COUNT(fr.id_reponse)::int AS reply_count,
			m.date_publication
		FROM messages_forum m
		LEFT JOIN utilisateurs u ON u.id_user = m.id_auteur
		LEFT JOIN forum_reponses fr ON fr.id_message = m.id_message
		WHERE m.id_cours = $1
	`
	args := []any{courseID}
	if category == "question" || category == "announcement" || category == "resource" {
		query += ` AND m.categorie = $2`
		args = append(args, category)
	}
	query += `
		GROUP BY m.id_message, u.id_user, u.prenom, u.nom, u.email, u.role
		ORDER BY m.date_publication DESC
	`

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	threads := make([]models.ForumThread, 0)
	for rows.Next() {
		var th models.ForumThread
		var accepted sql.NullInt64
		if err := rows.Scan(
			&th.IDMessage,
			&th.IDCours,
			&th.IDAuteur,
			&th.AuteurNom,
			&th.AuteurRole,
			&th.Titre,
			&th.Contenu,
			&th.Categorie,
			&th.IsResolved,
			&accepted,
			&th.ReplyCount,
			&th.DatePublication,
		); err != nil {
			return nil, err
		}
		if accepted.Valid {
			v := int(accepted.Int64)
			th.AcceptedReplyID = &v
		}
		threads = append(threads, th)
	}
	return threads, rows.Err()
}

func (r *ForumRepository) GetThreadWithReplies(messageID int) (*models.ForumThread, error) {
	threadQuery := `
		SELECT
			m.id_message,
			m.id_cours,
			m.id_auteur,
			COALESCE(NULLIF(TRIM(CONCAT(u.prenom, ' ', u.nom)), ''), u.email, 'Utilisateur') AS auteur_nom,
			COALESCE(u.role::text, 'etudiant') AS auteur_role,
			COALESCE(NULLIF(TRIM(m.titre), ''), LEFT(m.contenu, 80)) AS titre,
			m.contenu,
			COALESCE(m.categorie, 'question') AS categorie,
			COALESCE(m.is_resolved, FALSE) AS is_resolved,
			m.accepted_reply_id,
			m.date_publication
		FROM messages_forum m
		LEFT JOIN utilisateurs u ON u.id_user = m.id_auteur
		WHERE m.id_message = $1
	`
	var th models.ForumThread
	var accepted sql.NullInt64
	err := r.DB.QueryRow(threadQuery, messageID).Scan(
		&th.IDMessage,
		&th.IDCours,
		&th.IDAuteur,
		&th.AuteurNom,
		&th.AuteurRole,
		&th.Titre,
		&th.Contenu,
		&th.Categorie,
		&th.IsResolved,
		&accepted,
		&th.DatePublication,
	)
	if err != nil {
		return nil, err
	}
	if accepted.Valid {
		v := int(accepted.Int64)
		th.AcceptedReplyID = &v
	}

	replyQuery := `
		SELECT
			fr.id_reponse,
			fr.id_message,
			fr.parent_id_reponse,
			fr.id_auteur,
			COALESCE(NULLIF(TRIM(CONCAT(u.prenom, ' ', u.nom)), ''), u.email, 'Utilisateur') AS auteur_nom,
			COALESCE(u.role::text, 'etudiant') AS auteur_role,
			fr.contenu,
			fr.is_best_answer,
			fr.date_publication
		FROM forum_reponses fr
		LEFT JOIN utilisateurs u ON u.id_user = fr.id_auteur
		WHERE fr.id_message = $1
		ORDER BY fr.is_best_answer DESC, fr.date_publication ASC
	`
	rows, err := r.DB.Query(replyQuery, messageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	flat := make([]models.ForumReply, 0)
	for rows.Next() {
		var rep models.ForumReply
		var parent sql.NullInt64
		if err := rows.Scan(
			&rep.IDReponse,
			&rep.IDMessage,
			&parent,
			&rep.IDAuteur,
			&rep.AuteurNom,
			&rep.AuteurRole,
			&rep.Contenu,
			&rep.IsBestAnswer,
			&rep.DatePublication,
		); err != nil {
			return nil, err
		}
		if parent.Valid {
			p := int(parent.Int64)
			rep.ParentIDReponse = &p
		}
		rep.Children = make([]models.ForumReply, 0)
		flat = append(flat, rep)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	th.ReplyCount = len(flat)
	th.Replies = buildReplyTree(flat)
	return &th, nil
}

func buildReplyTree(flat []models.ForumReply) []models.ForumReply {
	childrenMap := make(map[int][]models.ForumReply)
	for _, item := range flat {
		if item.ParentIDReponse != nil {
			childrenMap[*item.ParentIDReponse] = append(childrenMap[*item.ParentIDReponse], item)
		}
	}

	var attach func(node models.ForumReply) models.ForumReply
	attach = func(node models.ForumReply) models.ForumReply {
		kids := childrenMap[node.IDReponse]
		node.Children = make([]models.ForumReply, 0, len(kids))
		for _, k := range kids {
			node.Children = append(node.Children, attach(k))
		}
		return node
	}

	roots := make([]models.ForumReply, 0)
	for _, item := range flat {
		if item.ParentIDReponse == nil {
			roots = append(roots, attach(item))
		}
	}
	return roots
}

func (r *ForumRepository) CreateThread(
	courseID int,
	authorID uuid.UUID,
	title string,
	content string,
	category models.ForumCategory,
) (*models.ForumThread, error) {
	query := `
		INSERT INTO messages_forum (id_cours, id_auteur, titre, contenu, categorie)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id_message, id_cours, id_auteur, titre, contenu, categorie, is_resolved, accepted_reply_id, date_publication
	`
	var th models.ForumThread
	var accepted sql.NullInt64
	err := r.DB.QueryRow(query, courseID, authorID, title, content, category).Scan(
		&th.IDMessage,
		&th.IDCours,
		&th.IDAuteur,
		&th.Titre,
		&th.Contenu,
		&th.Categorie,
		&th.IsResolved,
		&accepted,
		&th.DatePublication,
	)
	if err != nil {
		return nil, err
	}
	if accepted.Valid {
		v := int(accepted.Int64)
		th.AcceptedReplyID = &v
	}
	th.Replies = make([]models.ForumReply, 0)
	return &th, nil
}

func (r *ForumRepository) CreateReply(
	messageID int,
	authorID uuid.UUID,
	content string,
	parentReplyID *int,
) (*models.ForumReply, error) {
	query := `
		INSERT INTO forum_reponses (id_message, parent_id_reponse, id_auteur, contenu)
		VALUES ($1, $2, $3, $4)
		RETURNING id_reponse, id_message, parent_id_reponse, id_auteur, contenu, is_best_answer, date_publication
	`
	var rep models.ForumReply
	var parent sql.NullInt64
	err := r.DB.QueryRow(query, messageID, parentReplyID, authorID, content).Scan(
		&rep.IDReponse,
		&rep.IDMessage,
		&parent,
		&rep.IDAuteur,
		&rep.Contenu,
		&rep.IsBestAnswer,
		&rep.DatePublication,
	)
	if err != nil {
		return nil, err
	}
	if parent.Valid {
		p := int(parent.Int64)
		rep.ParentIDReponse = &p
	}
	rep.Children = make([]models.ForumReply, 0)
	return &rep, nil
}

func (r *ForumRepository) MarkBestAnswer(messageID int, replyID int) (*models.ForumThread, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var exists int
	err = tx.QueryRow(
		`SELECT id_reponse FROM forum_reponses WHERE id_reponse = $1 AND id_message = $2`,
		replyID,
		messageID,
	).Scan(&exists)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	if _, err := tx.Exec(`UPDATE forum_reponses SET is_best_answer = FALSE WHERE id_message = $1`, messageID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(
		`UPDATE forum_reponses SET is_best_answer = TRUE WHERE id_reponse = $1 AND id_message = $2`,
		replyID,
		messageID,
	); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(
		`UPDATE messages_forum SET is_resolved = TRUE, accepted_reply_id = $1 WHERE id_message = $2`,
		replyID,
		messageID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return r.GetThreadWithReplies(messageID)
}

func (r *ForumRepository) ToggleResolved(messageID int, resolved bool) (*models.ForumThread, error) {
	if !resolved {
		if _, err := r.DB.Exec(
			`UPDATE messages_forum SET is_resolved = FALSE, accepted_reply_id = NULL WHERE id_message = $1`,
			messageID,
		); err != nil {
			return nil, err
		}
		if _, err := r.DB.Exec(
			`UPDATE forum_reponses SET is_best_answer = FALSE WHERE id_message = $1`,
			messageID,
		); err != nil {
			return nil, err
		}
	} else {
		if _, err := r.DB.Exec(
			`UPDATE messages_forum SET is_resolved = TRUE WHERE id_message = $1`,
			messageID,
		); err != nil {
			return nil, err
		}
	}
	return r.GetThreadWithReplies(messageID)
}

func (r *ForumRepository) DeleteThread(messageID int) error {
	_, err := r.DB.Exec(`DELETE FROM messages_forum WHERE id_message = $1`, messageID)
	return err
}
