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
		INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, statut_actif, date_inscription)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id_user`

	err := r.db.QueryRowContext(ctx, query,
		u.Nom,
		u.Prenom,
		u.Email,
		u.MotDePasse,
		u.Role,
		u.StatutActif,
		u.DateInscription,
	).Scan(&u.IDUser)

	return err
}

func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*models.Utilisateur, error) {
	query := `
		SELECT id_user, nom, prenom, email, mot_de_passe, role, statut_actif, date_inscription
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
	)

	if err != nil {
		return nil, err
	}

	return u, nil
}

func (r *UserRepository) GetUserByID(ctx context.Context, id string) (*models.Utilisateur, error) {
	query := `
		SELECT id_user, nom, prenom, email, role, statut_actif, date_inscription
		FROM utilisateurs
		WHERE id_user = $1`

	u := &models.Utilisateur{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&u.IDUser,
		&u.Nom,
		&u.Prenom,
		&u.Email,
		&u.Role,
		&u.StatutActif,
		&u.DateInscription,
	)

	if err != nil {
		return nil, err
	}

	return u, nil
}

func (r *UserRepository) GetAllUsers(ctx context.Context) ([]models.Utilisateur, error) {
	query := `SELECT id_user, nom, prenom, email, role, statut_actif, date_inscription FROM utilisateurs`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.Utilisateur
	for rows.Next() {
		var u models.Utilisateur
		if err := rows.Scan(&u.IDUser, &u.Nom, &u.Prenom, &u.Email, &u.Role, &u.StatutActif, &u.DateInscription); err != nil {
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
