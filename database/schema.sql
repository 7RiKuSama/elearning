CREATE TYPE user_role AS ENUM ('etudiant', 'enseignant', 'admin');

CREATE TABLE utilisateurs (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    statut_actif BOOLEAN DEFAULT true,
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id_categorie SERIAL PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE cours (
    id_cours SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    est_publie BOOLEAN DEFAULT false,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_categorie INT REFERENCES categories(id_categorie) ON DELETE SET NULL,
    id_enseignant UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE
);

CREATE TABLE inscriptions (
    id_etudiant UUID REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_cours INT REFERENCES cours(id_cours) ON DELETE CASCADE,
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progression_pourcentage DECIMAL(5,2) DEFAULT 0.00,
    PRIMARY KEY (id_etudiant, id_cours)
);

DROP TABLE IF EXISTS ressources CASCADE;

CREATE TABLE ressources (
    id_ressource SERIAL PRIMARY KEY,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(50) NOT NULL,
    taille_fichier BIGINT DEFAULT 0,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_cours INT NOT NULL REFERENCES cours(id_cours) ON DELETE CASCADE,
    id_uploader UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE
);

CREATE TABLE evaluations (
    id_evaluation SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    bareme INT NOT NULL,
    date_ouverture TIMESTAMP WITH TIME ZONE NOT NULL,
    date_cloture TIMESTAMP WITH TIME ZONE NOT NULL,
    nom_fichier VARCHAR(255),
    chemin_fichier VARCHAR(500),
    id_cours INT NOT NULL REFERENCES cours(id_cours) ON DELETE CASCADE
);

CREATE TABLE soumissions (
    id_soumission SERIAL PRIMARY KEY,
    fichier_soumis VARCHAR(500) NOT NULL,
    note_obtenue DECIMAL(4,2),
    commentaire_professeur TEXT,
    date_envoi TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_evaluation INT NOT NULL REFERENCES evaluations(id_evaluation) ON DELETE CASCADE,
    id_etudiant UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    UNIQUE(id_evaluation, id_etudiant)
);

CREATE TABLE messages_forum (
    id_message SERIAL PRIMARY KEY,
    contenu TEXT NOT NULL,
    date_publication TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_auteur UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_cours INT NOT NULL REFERENCES cours(id_cours) ON DELETE CASCADE
);
