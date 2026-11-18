// File: src/types/index.ts

export type Role = 'etudiant' | 'enseignant' | 'admin';

export interface Utilisateur {
  id_user: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  statut_actif: boolean;
  date_inscription: string;
}

export interface Categorie {
  id_categorie: number;
  nom: string;
  description: string;
}

export interface Cours {
  id_cours: number;
  titre: string;
  description: string;
  est_publie: boolean;
  date_creation: string;
  id_categorie: number;
  id_enseignant: string;
}

export interface Inscription {
  id_etudiant: string;
  id_cours: number;
  date_inscription: string;
  progression_pourcentage: number;
}

export interface Ressource {
  id_ressource: number;
  id_cours: number;
  nom_fichier: string;
  type_fichier: string; // ex: 'pdf', 'video', 'image', 'text'
  chemin_fichier: string;
  taille_fichier: number;
  date_upload: string;
  id_uploader: string;
}

export interface Evaluation {
  id_evaluation: number;
  id_cours: number;
  titre: string;
  instructions: string;
  bareme: number;
  date_ouverture: string;
  date_cloture: string;
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
  date_publication: string;
  id_auteur: string;
  id_cours: number;
}

export interface PlatformStats {
  active_users: number;
  total_courses: number;
  total_submissions: number;
}
