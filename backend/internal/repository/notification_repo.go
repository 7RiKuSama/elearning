// File: internal/repository/notification_repo.go
package repository

import (
	"database/sql"

	"pfel-elearning/internal/models"

	"github.com/google/uuid"
)

type NotificationRepository struct {
	DB *sql.DB
}

func NewNotificationRepository(db *sql.DB) *NotificationRepository {
	return &NotificationRepository{DB: db}
}

func (r *NotificationRepository) Create(
	recipientID uuid.UUID,
	courseID *int,
	notifType string,
	title string,
	message string,
	link string,
) error {
	_, err := r.DB.Exec(`
		INSERT INTO notifications (id_destinataire, id_cours, type_notif, titre, message, lien)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, recipientID, courseID, notifType, title, message, link)
	return err
}

func (r *NotificationRepository) NotifyEnrolledStudents(
	courseID int,
	notifType string,
	title string,
	message string,
	link string,
) error {
	_, err := r.DB.Exec(`
		INSERT INTO notifications (id_destinataire, id_cours, type_notif, titre, message, lien)
		SELECT id_etudiant, $1, $2, $3, $4, $5
		FROM inscriptions
		WHERE id_cours = $1
	`, courseID, notifType, title, message, link)
	return err
}

func (r *NotificationRepository) NotifyCourseTeacher(
	courseID int,
	notifType string,
	title string,
	message string,
	link string,
) error {
	_, err := r.DB.Exec(`
		INSERT INTO notifications (id_destinataire, id_cours, type_notif, titre, message, lien)
		SELECT id_enseignant, id_cours, $2, $3, $4, $5
		FROM cours
		WHERE id_cours = $1
	`, courseID, notifType, title, message, link)
	return err
}

func (r *NotificationRepository) ListByUser(userID uuid.UUID, limit int) ([]models.Notification, int, error) {
	if limit <= 0 || limit > 100 {
		limit = 25
	}

	var unreadCount int
	if err := r.DB.QueryRow(`
		SELECT COUNT(*)::int FROM notifications
		WHERE id_destinataire = $1 AND is_read = FALSE
	`, userID).Scan(&unreadCount); err != nil {
		return nil, 0, err
	}

	rows, err := r.DB.Query(`
		SELECT id_notification, id_destinataire, id_cours, type_notif, titre, message, lien, is_read, date_creation
		FROM notifications
		WHERE id_destinataire = $1
		ORDER BY date_creation DESC
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	list := make([]models.Notification, 0)
	for rows.Next() {
		var n models.Notification
		var cid sql.NullInt64
		if err := rows.Scan(
			&n.IDNotification,
			&n.IDDestinataire,
			&cid,
			&n.TypeNotif,
			&n.Titre,
			&n.Message,
			&n.Lien,
			&n.IsRead,
			&n.DateCreation,
		); err != nil {
			return nil, 0, err
		}
		if cid.Valid {
			v := int(cid.Int64)
			n.IDCours = &v
		}
		list = append(list, n)
	}
	return list, unreadCount, rows.Err()
}

func (r *NotificationRepository) MarkRead(notifID int, userID uuid.UUID) error {
	_, err := r.DB.Exec(`
		UPDATE notifications SET is_read = TRUE
		WHERE id_notification = $1 AND id_destinataire = $2
	`, notifID, userID)
	return err
}

func (r *NotificationRepository) MarkAllRead(userID uuid.UUID) error {
	_, err := r.DB.Exec(`
		UPDATE notifications SET is_read = TRUE
		WHERE id_destinataire = $1 AND is_read = FALSE
	`, userID)
	return err
}
