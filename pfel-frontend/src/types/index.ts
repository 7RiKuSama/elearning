// File: src/types/index.ts

export type Role = 'ETUDIANT' | 'ENSEIGNANT' | 'ADMIN';

export interface Utilisateur {
  id_user: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  avatar_url?: string | null;
  statut_actif?: boolean;
}

export interface Categorie {
  id_categorie: number;
  nom: string;
  description: string;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Cours {
  id_cours: number;
  titre: string;
  description: string;
  est_publie: boolean;
  date_creation: string;
  id_categorie: number;
  id_enseignant: string;
  cover_url?: string;
  estimated_duration?: string;
  difficulty_level?: DifficultyLevel | string;
  prerequisites?: string;
}

export interface Module {
  id_module: number;
  id_cours: number;
  titre: string;
  description: string;
  ordre_affichage: number;
  date_creation: string;
}

export interface Ressource {
  id_ressource: number;
  nom_fichier: string;
  chemin_fichier: string;
  type_fichier: string;
  taille_fichier: number;
  date_upload: string;
  id_cours: number;
  id_uploader: string;
  id_module?: number | null;
}

export interface Inscription {
  id_etudiant: string;
  id_cours: number;
  date_inscription: string;
  progression_pourcentage: number;
}

export interface Evaluation {
  id_evaluation: number;
  id_cours: number;
  titre: string;
  instructions: string;
  bareme: number;
  date_ouverture: string;
  date_cloture: string;
  nom_fichier?: string;
  chemin_fichier?: string;
}

export interface Soumission {
  id_soumission: number;
  id_evaluation: number;
  id_etudiant: string;
  fichier_soumis: string;
  note_obtenue: number | null;
  commentaire_professeur: string;
  date_envoi: string;
}

export interface MessageForum {
  id_message: number;
  contenu: string;
  date_post: string;
  id_cours: number;
  id_auteur: string;
}
