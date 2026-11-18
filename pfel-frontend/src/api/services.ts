// File: src/api/services.ts
import api from './axios';
import type { 
  Cours, 
  Categorie, 
  Inscription, 
  Ressource, 
  Evaluation, 
  Soumission, 
  Utilisateur 
} from '../types';

// ==================== UPLOAD PHYSIQUE DE FICHIER ====================
export const uploadFileToServer = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{
    nom_fichier: string;
    chemin_fichier: string;
    taille_fichier: number;
  }>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ==================== AUTH & PROFIL ====================
export const login = async (credentials: { email: string; mot_de_passe: string }) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const register = async (data: { nom: string; prenom: string; email: string; mot_de_passe: string; role: string }) => {
  const response = await api.post('/register', data);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get<Utilisateur>('/profil');
  return response.data;
};

// ==================== CATEGORIES & COURS ====================
export const getCategories = async () => {
  const response = await api.get<Categorie[]>('/categories');
  return response.data;
};

export const createCategory = async (data: { nom: string; description: string }) => {
  const response = await api.post<Categorie>('/categories', data);
  return response.data;
};

export const getCatalog = async () => {
  const response = await api.get<Cours[]>('/cours');
  return response.data;
};

export const createCourse = async (data: { titre: string; description: string; est_publie: boolean; id_categorie: number }) => {
  const response = await api.post<Cours>('/cours', data);
  return response.data;
};

export const updateCourse = async (id: number, data: { titre: string; description: string; est_publie: boolean; id_categorie: number }) => {
  const response = await api.put(`/cours/${id}`, data);
  return response.data;
};

export const assignTeacherToCourse = async (idCours: number, idEnseignant: string) => {
  const response = await api.put(`/cours/${idCours}/enseignant`, { id_enseignant: idEnseignant });
  return response.data;
};

// ==================== INSCRIPTIONS (ETUDIANT) ====================
export const enrollCourse = async (idCours: number) => {
  const response = await api.post(`/cours/${idCours}/inscription`);
  return response.data;
};

export const getMyEnrollments = async () => {
  const response = await api.get<Inscription[]>('/mes-cours');
  return response.data;
};

export const getCourseStudents = async (idCours: number) => {
  const response = await api.get(`/cours/${idCours}/etudiants`);
  return response.data;
};

// ==================== RESSOURCES & EVALUATIONS ====================
export const getCourseResources = async (idCours: number) => {
  const response = await api.get<Ressource[]>(`/cours/${idCours}/ressources`);
  return response.data;
};

export const uploadResource = async (idCours: number, data: { nom_fichier: string; chemin_fichier: string; type_fichier: string; taille_fichier?: number }) => {
  const response = await api.post<Ressource>(`/cours/${idCours}/ressources`, data);
  return response.data;
};

export const getCourseEvaluations = async (idCours: number) => {
  const response = await api.get<Evaluation[]>(`/cours/${idCours}/evaluations`);
  return response.data;
};

export const createEvaluation = async (
  idCours: number, 
  data: { 
    titre: string; 
    instructions: string; 
    bareme: number; 
    date_ouverture: string; 
    date_cloture: string;
    nom_fichier?: string;
    chemin_fichier?: string;
  }
) => {
  const response = await api.post<Evaluation>(`/cours/${idCours}/evaluations`, data);
  return response.data;
};

export const submitEvaluation = async (idEval: number, fichier_soumis: string) => {
  const response = await api.post<Soumission>(`/evaluations/${idEval}/soumissions`, { fichier_soumis });
  return response.data;
};

export const getEvaluationSubmissions = async (idEval: number) => {
  const response = await api.get<Soumission[]>(`/evaluations/${idEval}/soumissions`);
  return response.data;
};

export const gradeSubmission = async (idSub: number, note: number, commentaires: string) => {
  const response = await api.put(`/soumissions/${idSub}/note`, { note, commentaires });
  return response.data;
};

export const getStudentGrades = async () => {
  const response = await api.get('/mes-notes');
  return response.data;
};

// ==================== FORUM ====================
export const getCourseForum = async (idCours: number) => {
  const response = await api.get(`/cours/${idCours}/forum`);
  return response.data;
};

export const postForumMessage = async (idCours: number, contenu: string) => {
  const response = await api.post(`/cours/${idCours}/forum`, { contenu });
  return response.data;
};

export const deleteForumMessage = async (idMessage: number) => {
  const response = await api.delete(`/forum/messages/${idMessage}`);
  return response.data;
};

// ==================== ADMINISTRATION UTILISATEURS ====================
export const getAllUsers = async () => {
  const response = await api.get<Utilisateur[]>('/utilisateurs');
  return response.data;
};

export const updateUserStatus = async (idUser: string, statut_actif: boolean) => {
  const response = await api.put(`/utilisateurs/${idUser}/statut`, { statut_actif });
  return response.data;
};

export const updateUserRole = async (idUser: string, role: string) => {
  const response = await api.put(`/utilisateurs/${idUser}/role`, { role });
  return response.data;
};

export const deleteUser = async (idUser: string) => {
  const response = await api.delete(`/utilisateurs/${idUser}`);
  return response.data;
};

export const getPlatformStats = async () => {
  const response = await api.get('/statistiques');
  return response.data;
};
