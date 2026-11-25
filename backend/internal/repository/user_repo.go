package repository

import (
	"context"
	"database/sql"
	"pfel-elearning/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(ctx context.Context, u *models.Utilisateur) error {
	query := `
		INSERT INTO utilisateurs (
			nom, prenom, email, mot_de_passe, role, statut_actif, date_inscription,
			avatar_url, bio, notif_evaluations, notif_submissions, notif_grades, notif_forum
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id_user`

	err := r.db.QueryRowContext(ctx, query,
		u.Nom,
		u.Prenom,
		u.Email,
		u.MotDePasse,
		u.Role,
		u.StatutActif,
		u.DateInscription,
		u.AvatarURL,
		u.Bio,
		u.NotifEvaluations,
		u.NotifSubmissions,
		u.NotifGrades,
		u.NotifForum,
	).Scan(&u.IDUser)

	return err
}

func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*models.Utilisateur, error) {
	query := `
		SELECT
			id_user, nom, prenom, email, mot_de_passe, role, statut_actif, date_inscription,
			COALESCE(avatar_url, ''),
			COALESCE(bio, ''),
			COALESCE(notif_evaluations, TRUE),
			COALESCE(notif_submissions, TRUE),
			COALESCE(notif_grades, TRUE),
			COALESCE(notif_forum, TRUE)
		FROM utilisateurs
		WHERE email = $1`

	u := &models.Utilisateur{}
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&u.IDUser,
		&u.Nom,
		&u.Prenom,
		&u.Email,
		&u.MotDePasse,
		&u.Role,
		&u.StatutActif,
		&u.DateInscription,
		&u.AvatarURL,
		&u.Bio,
		&u.NotifEvaluations,
		&u.NotifSubmissions,
		&u.NotifGrades,
		&u.NotifForum,
	)

	if err != nil {
		return nil, err
	}

	return u, nil
}

func (r *UserRepository) GetUserByID(ctx context.Context, id string) (*models.Utilisateur, error) {
	query := `
		SELECT
			id_user, nom, prenom, email, mot_de_passe, role, statut_actif, date_inscription,
			COALESCE(avatar_url, ''),
			COALESCE(bio, ''),
			COALESCE(notif_evaluations, TRUE),
			COALESCE(notif_submissions, TRUE),
			COALESCE(notif_grades, TRUE),
			COALESCE(notif_forum, TRUE)
		FROM utilisateurs
		WHERE id_user = $1`

	u := &models.Utilisateur{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&u.IDUser,
		&u.Nom,
		&u.Prenom,
		&u.Email,
		&u.MotDePasse,
		&u.Role,
		&u.StatutActif,
		&u.DateInscription,
		&u.AvatarURL,
		&u.Bio,
		&u.NotifEvaluations,
		&u.NotifSubmissions,
		&u.NotifGrades,
		&u.NotifForum,
	)

	if err != nil {
		return nil, err
	}

	return u, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, u *models.Utilisateur) (*models.Utilisateur, error) {
	query := `
		UPDATE utilisateurs
		SET
			nom = $2,
			prenom = $3,
			bio = $4,
			avatar_url = $5,
			notif_evaluations = $6,
			notif_submissions = $7,
			notif_grades = $8,
			notif_forum = $9
		WHERE id_user = $1
		RETURNING
			id_user, nom, prenom, email, role, statut_actif, date_inscription,
			COALESCE(avatar_url, ''),
			COALESCE(bio, ''),
			COALESCE(notif_evaluations, TRUE),
			COALESCE(notif_submissions, TRUE),
			COALESCE(notif_grades, TRUE),
			COALESCE(notif_forum, TRUE)`

	updated := &models.Utilisateur{}
	err := r.db.QueryRowContext(ctx, query,
		u.IDUser,
		u.Nom,
		u.Prenom,
		u.Bio,
		u.AvatarURL,
		u.NotifEvaluations,
		u.NotifSubmissions,
		u.NotifGrades,
		u.NotifForum,
	).Scan(
		&updated.IDUser,
		&updated.Nom,
		&updated.Prenom,
		&updated.Email,
		&updated.Role,
		&updated.StatutActif,
		&updated.DateInscription,
		&updated.AvatarURL,
		&updated.Bio,
		&updated.NotifEvaluations,
		&updated.NotifSubmissions,
		&updated.NotifGrades,
		&updated.NotifForum,
	)

	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, userID string, hashedPassword string) error {
	query := `UPDATE utilisateurs SET mot_de_passe = $1 WHERE id_user = $2`
	res, err := r.db.ExecContext(ctx, query, hashedPassword, userID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *UserRepository) GetAllUsers(ctx context.Context) ([]models.Utilisateur, error) {
	query := `
		SELECT
			id_user, nom, prenom, email, role, statut_actif, date_inscription,
			COALESCE(avatar_url, ''),
			COALESCE(bio, ''),
			COALESCE(notif_evaluations, TRUE),
			COALESCE(notif_submissions, TRUE),
			COALESCE(notif_grades, TRUE),
			COALESCE(notif_forum, TRUE)
		FROM utilisateurs`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.Utilisateur
	for rows.Next() {
		var u models.Utilisateur
		if err := rows.Scan(
			&u.IDUser,
			&u.Nom,
			&u.Prenom,
			&u.Email,
			&u.Role,
			&u.StatutActif,
			&u.DateInscription,
			&u.AvatarURL,
			&u.Bio,
			&u.NotifEvaluations,
			&u.NotifSubmissions,
			&u.NotifGrades,
			&u.NotifForum,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepository) UpdateUserStatus(ctx context.Context, userID string, actif bool) error {
	query := `UPDATE utilisateurs SET statut_actif = $1 WHERE id_user = $2`
	_, err := r.db.ExecContext(ctx, query, actif, userID)
	return err
}

func (r *UserRepository) UpdateUserRole(ctx context.Context, userID string, role string) error {
	query := `UPDATE utilisateurs SET role = $1 WHERE id_user = $2`
	_, err := r.db.ExecContext(ctx, query, role, userID)
	return err
}

func (r *UserRepository) DeleteUser(ctx context.Context, userID string) error {
	query := `DELETE FROM utilisateurs WHERE id_user = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}
