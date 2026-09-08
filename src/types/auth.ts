export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  workspaceId: string;
}

export type SyncStatus = "offline" | "syncing" | "synced" | "error";

