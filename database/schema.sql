CREATE TYPE user_role AS ENUM ('etudiant', 'enseignant', 'admin');

CREATE TABLE IF NOT EXISTS utilisateurs (
    id_user           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom               VARCHAR(100) NOT NULL,
    prenom            VARCHAR(100) NOT NULL,
    email             VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL,
    role              VARCHAR(30) NOT NULL DEFAULT 'etudiant',
    statut_actif      BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url        TEXT NOT NULL DEFAULT '',
    bio               TEXT NOT NULL DEFAULT '',
    notif_evaluations BOOLEAN NOT NULL DEFAULT TRUE,
    notif_submissions BOOLEAN NOT NULL DEFAULT TRUE,
    notif_grades      BOOLEAN NOT NULL DEFAULT TRUE,
    notif_forum       BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation     TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    id_enseignant UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    cover_url TEXT DEFAULT '',
    estimated_duration VARCHAR(100) DEFAULT '',
    difficulty_level VARCHAR(50) DEFAULT 'Beginner',
    prerequisites TEXT DEFAULT ''
);

CREATE TABLE inscriptions (
    id_etudiant UUID REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_cours INT REFERENCES cours(id_cours) ON DELETE CASCADE,
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progression_pourcentage DECIMAL(5,2) DEFAULT 0.00,
    PRIMARY KEY (id_etudiant, id_cours)
);

CREATE TABLE IF NOT EXISTS modules (
    id_module SERIAL PRIMARY KEY,
    id_cours INT NOT NULL REFERENCES cours(id_cours) ON DELETE CASCADE,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    ordre_affichage INT NOT NULL DEFAULT 1,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS ressources CASCADE;

CREATE TABLE IF NOT EXISTS ressources (
    id_ressource SERIAL PRIMARY KEY,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(50) NOT NULL,
    taille_fichier BIGINT DEFAULT 0,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_cours INT NOT NULL REFERENCES cours(id_cours) ON DELETE CASCADE,
    id_uploader UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_module INT REFERENCES modules(id_module) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ressources_consultees (
    id_etudiant UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_ressource INT NOT NULL REFERENCES ressources(id_ressource) ON DELETE CASCADE,
    date_consultation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_etudiant, id_ressource)
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

CREATE TABLE IF NOT EXISTS quiz_questions (
  id_question SERIAL PRIMARY KEY,
  id_evaluation INTEGER NOT NULL REFERENCES evaluations(id_evaluation) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL DEFAULT 'mcq', -- 'mcq' | 'true_false'
  prompt TEXT NOT NULL,
  options_json JSONB NOT NULL, -- array of strings, e.g. ["True", "False"] or 4 MCQ options
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0),
  points NUMERIC(6,2) NOT NULL DEFAULT 1,
  explanation TEXT NOT NULL DEFAULT '',
  ordre_affichage INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id_attempt SERIAL PRIMARY KEY,
  id_evaluation INTEGER NOT NULL REFERENCES evaluations(id_evaluation) ON DELETE CASCADE,
  id_etudiant UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  answers_json JSONB NOT NULL, -- map[questionId]selectedIndex
  score NUMERIC(6,2) NOT NULL,
  max_score NUMERIC(6,2) NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_evaluation, id_etudiant)
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
    titre VARCHAR(220),
    contenu TEXT NOT NULL,
    categorie VARCHAR(24) NOT NULL DEFAULT 'question'
        CHECK (categorie IN ('question', 'announcement', 'resource')),
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_reply_id INTEGER,
    date_publication TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_auteur UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_cours INT NOT NULL REFERENCES cours(id_cours) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_reponses (
    id_reponse SERIAL PRIMARY KEY,
    id_message INTEGER NOT NULL REFERENCES messages_forum(id_message) ON DELETE CASCADE,
    parent_id_reponse INTEGER REFERENCES forum_reponses(id_reponse) ON DELETE CASCADE,
    id_auteur UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    is_best_answer BOOLEAN NOT NULL DEFAULT FALSE,
    date_publication TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages_forum
    DROP CONSTRAINT IF EXISTS fk_messages_forum_accepted_reply,
    ADD CONSTRAINT fk_messages_forum_accepted_reply
    FOREIGN KEY (accepted_reply_id) REFERENCES forum_reponses(id_reponse) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_forum_cours_date
    ON messages_forum (id_cours, date_publication DESC);

CREATE INDEX IF NOT EXISTS idx_forum_reponses_message_date
    ON forum_reponses (id_message, date_publication ASC);


CREATE TABLE IF NOT EXISTS notifications (
    id_notification SERIAL PRIMARY KEY,
    id_destinataire UUID NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_cours        INT REFERENCES cours(id_cours) ON DELETE CASCADE,
    type_notif      VARCHAR(40) NOT NULL,
    titre           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    lien            VARCHAR(255) NOT NULL DEFAULT '',
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_dest_date
    ON notifications (id_destinataire, is_read, date_creation DESC);

CREATE TABLE IF NOT EXISTS ressource_completions (
  id_completion SERIAL PRIMARY KEY,
  id_utilisateur INTEGER NOT NULL,
  id_cours INTEGER NOT NULL,
  id_ressource INTEGER NOT NULL,
  termine BOOLEAN NOT NULL DEFAULT TRUE,
  date_completion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_resource_completion UNIQUE (id_utilisateur, id_ressource)
);

CREATE INDEX IF NOT EXISTS idx_ressource_completions_user_course
  ON ressource_completions (id_utilisateur, id_cours);
