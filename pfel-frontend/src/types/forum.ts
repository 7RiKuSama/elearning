// File: src/types/forum.ts
export type ForumCategory = 'question' | 'announcement' | 'resource';

export interface ForumReply {
  id_reponse: number;
  id_message: number;
  parent_id_reponse?: number | null;
  id_auteur: string;
  auteur_nom?: string;
  auteur_role?: string;
  contenu: string;
  is_best_answer: boolean;
  date_publication: string;
  children?: ForumReply[];
}

export interface ForumThread {
  id_message: number;
  id_cours: number;
  id_auteur: string;
  auteur_nom?: string;
  auteur_role?: string;
  titre: string;
  contenu: string;
  categorie: ForumCategory;
  is_resolved: boolean;
  accepted_reply_id?: number | null;
  reply_count: number;
  date_publication: string;
  replies?: ForumReply[];
}
