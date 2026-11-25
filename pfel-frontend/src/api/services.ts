// File: src/api/services.ts
import api from './axios';
import type {
  Cours,
  Categorie,
  Inscription,
  Ressource,
  Evaluation,
  Soumission,
  Utilisateur,
  Module,
} from '../types';
import type { DraftQuizQuestion } from '../pages/components/QuizBuilderModal';
import type { QuizQuestionItem, QuizSubmissionResult } from '../pages/components/QuizPlayerModal';
import type { ForumCategory, ForumReply, ForumThread } from '../types/forum';
import type { NotificationsResponse } from '../types/notification';

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
export const login = async (credentials: { email: string; mot_de_passe?: string; password?: string }) => {
  const payload = {
    email: credentials.email,
    password: credentials.password ?? credentials.mot_de_passe ?? '',
  };
  const { data } = await api.post('/login', payload);
  return data;
};

export const getProfile = async () => {
  const response = await api.get<Utilisateur>('/profil');
  return response.data;
};

export const register = async (data: {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe?: string;
  password?: string;
  role: string;
}) => {
  const payload = {
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    password: data.password ?? data.mot_de_passe ?? '',
    role: data.role,
  };
  const { data: resData } = await api.post('/register', payload);
  return resData;
};

// ==================== CATEGORIES & COURS ====================
export const getCategories = async () => {
  try {
    const response = await api.get<Categorie[]>('/categories');
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};

export const createCategory = async (data: { nom: string; description: string }) => {
  const response = await api.post<Categorie>('/categories', data);
  return response.data;
};

export const getCatalog = async () => {
  const response = await api.get<Cours[]>('/cours');
  return response.data;
};

export interface CoursePayload {
  titre: string;
  description: string;
  est_publie: boolean;
  id_categorie: number;
  cover_url?: string;
  estimated_duration?: string;
  difficulty_level?: string;
  prerequisites?: string;
}

export const createCourse = async (data: CoursePayload) => {
  const response = await api.post<Cours>('/cours', data);
  return response.data;
};

export const updateCourse = async (id: number, data: CoursePayload) => {
  const response = await api.put(`/cours/${id}`, data);
  return response.data;
};

export const assignTeacherToCourse = async (idCours: number, idEnseignant: string) => {
  const response = await api.put(`/cours/${idCours}/enseignant`, { id_enseignant: idEnseignant });
  return response.data;
};

// ==================== MODULES / CHAPITRES ====================
export const getCourseModules = async (idCours: number) => {
  const response = await api.get<Module[]>(`/courses/${idCours}/modules`);
  return response.data;
};

export const createModule = async (
  idCours: number,
  data: { titre: string; description?: string; ordre_affichage?: number }
) => {
  const response = await api.post<Module>(`/courses/${idCours}/modules`, data);
  return response.data;
};

export const updateModule = async (
  idModule: number,
  data: { titre: string; description?: string; ordre_affichage: number }
) => {
  const response = await api.put<Module>(`/modules/${idModule}`, data);
  return response.data;
};

export const deleteModule = async (idModule: number) => {
  const response = await api.delete(`/modules/${idModule}`);
  return response.data;
};

export const reorderCourseModules = async (idCours: number, ordered_ids: number[]) => {
  const response = await api.put(`/courses/${idCours}/modules/reorder`, { ordered_ids });
  return response.data;
};

export const assignResourceToModule = async (idRessource: number, id_module: number | null) => {
  const response = await api.patch(`/resources/${idRessource}/module`, { id_module });
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

export const uploadResource = async (
  idCours: number,
  data: {
    nom_fichier: string;
    chemin_fichier: string;
    type_fichier: string;
    taille_fichier?: number;
    id_module?: number | null;
  }
) => {
  const response = await api.post<Ressource>(`/cours/${idCours}/ressources`, data);
  return response.data;
};

export const getCourseEvaluations = async (idCours: number) => {
  const response = await api.get<Evaluation[]>(`/courses/${idCours}/evaluations`);
  return response.data;
};

export const createEvaluation = async (
  idCours: number,
  data: {
    titre: string;
    instructions: string;
    bareme: number;
    type_evaluation?: 'file' | 'quiz';
    passing_score?: number | null;
    date_ouverture: string;
    date_cloture: string;
    nom_fichier?: string;
    chemin_fichier?: string;
  }
) => {
  const response = await api.post<Evaluation>(`/courses/${idCours}/evaluations`, data);
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

export const markResourceAsViewed = async (idRessource: number) => {
  const response = await api.post<{ progression_pourcentage: number }>(`/ressources/${idRessource}/consultation`);
  return response.data;
};

export const getCompletedResources = async (idCours: number) => {
  const response = await api.get<number[]>(`/cours/${idCours}/ressources-consultees`);
  return response.data;
};

// ==================== FORUM FILS DE DISCUSSION ====================
export const getForumThreads = async (
  idCours: number,
  category?: 'question' | 'announcement' | 'resource' | 'all'
) => {
  const params = category && category !== 'all' ? { category } : undefined;
  const response = await api.get<ForumThread[]>(`/cours/${idCours}/forum`, { params });
  return Array.isArray(response.data) ? response.data : [];
};

export const getForumThreadDetail = async (threadId: number) => {
  const response = await api.get<ForumThread>(`/forum/threads/${threadId}`);
  return response.data;
};

export const createForumThread = async (
  idCours: number,
  payload: { titre: string; contenu: string; categorie: ForumCategory }
) => {
  const response = await api.post<ForumThread>(`/cours/${idCours}/forum`, payload);
  return response.data;
};

export const createForumReply = async (
  threadId: number,
  payload: { contenu: string; parent_id_reponse?: number | null }
) => {
  const response = await api.post<ForumReply>(`/forum/threads/${threadId}/replies`, payload);
  return response.data;
};

export const markForumBestAnswer = async (threadId: number, replyId: number) => {
  const response = await api.put<ForumThread>(
    `/forum/threads/${threadId}/replies/${replyId}/best-answer`
  );
  return response.data;
};

export const setForumThreadResolved = async (threadId: number, is_resolved: boolean) => {
  const response = await api.patch<ForumThread>(`/forum/threads/${threadId}/resolve`, {
    is_resolved,
  });
  return response.data;
};

export const deleteForumThread = async (threadId: number) => {
  const response = await api.delete(`/forum/threads/${threadId}`);
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

// ==================== QUIZ INTERACTIFS ====================
export async function saveEvaluationQuiz(
  evaluationId: number,
  questions: DraftQuizQuestion[]
): Promise<void> {
  await api.post(`/evaluations/${evaluationId}/quiz`, { questions });
}

export async function getEvaluationQuiz(evaluationId: number): Promise<QuizQuestionItem[]> {
  const res = await api.get(`/evaluations/${evaluationId}/quiz`);
  return res.data?.questions ?? res.data ?? [];
}

export async function submitEvaluationQuiz(
  evaluationId: number,
  answers: Record<number, number>
): Promise<QuizSubmissionResult> {
  const res = await api.post(`/evaluations/${evaluationId}/quiz/submit`, { answers });
  return res.data;
}

// ==================== NOTIFICATIONS ====================
export const getNotifications = async () => {
  const response = await api.get<NotificationsResponse>('/notifications');
  return response.data;
};

export const markNotificationRead = async (id: number) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.post('/notifications/read-all');
  return response.data;
};

export interface UserProfile {
  id_user: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  avatar_url: string;
  bio: string;
  notif_evaluations: boolean;
  notif_submissions: boolean;
  notif_grades: boolean;
  notif_forum: boolean;
}

export interface UpdateProfilePayload {
  nom: string;
  prenom: string;
  bio: string;
  avatar_url: string;
  notif_evaluations: boolean;
  notif_submissions: boolean;
  notif_grades: boolean;
  notif_forum: boolean;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const res = await api.get<UserProfile>('/profil');
    return res.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const res = await api.put<UserProfile>('/profil', payload);
    return res.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const res = await api.put<{ message: string }>('/profil/password', payload);
    return res.data;
  },
};

// ############### Course Completion #####################
export interface CourseCompletionsPayload {
  id_cours: number;
  completed_resource_ids: number[];
}

export interface ToggleCompletionPayload {
  id_ressource: number;
  id_cours: number;
  termine: boolean;
  completed_resource_ids: number[];
}

export const getCourseCompletions = async (courseId: number): Promise<number[]> => {
  const { data } = await api.get<CourseCompletionsPayload | number[]>(
    `/cours/${courseId}/completions`
  );
  if (Array.isArray(data)) {
    return data.map(Number).filter((id) => !Number.isNaN(id));
  }
  return Array.isArray(data?.completed_resource_ids)
    ? data.completed_resource_ids.map(Number).filter((id) => !Number.isNaN(id))
    : [];
};

export const toggleResourceCompletion = async (
  resourceId: number,
  termine?: boolean
): Promise<ToggleCompletionPayload> => {
  const body = typeof termine === 'boolean' ? { termine } : {};
  const { data } = await api.post<ToggleCompletionPayload>(
    `/ressources/${resourceId}/toggle-completion`,
    body
  );
  return data;
};
