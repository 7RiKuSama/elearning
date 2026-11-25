// File: src/types/notification.ts
export interface AppNotification {
  id_notification: number;
  titre: string;
  message: string;
  lien?: string | null;
  is_read: boolean;
  created_at?: string;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: AppNotification[];
}
