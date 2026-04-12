/**
 * Typed API client for LLP Backend (http://localhost:3001).
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const tasks = await api.tasks.list(teamId);
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("llp_access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const get  = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
const del = (path: string) => request<void>(path, { method: "DELETE" });

// ---------------------------------------------------------------------------
// API namespaces
// ---------------------------------------------------------------------------

export const api = {
  // -- Auth ------------------------------------------------------------------
  auth: {
    login: (email: string, password: string) =>
      post<{ accessToken: string; refreshToken: string; user: { id: string; email: string; name: string } }>(
        "/api/auth/login",
        { email, password }
      ),
    register: (email: string, password: string, name: string, firstName?: string, lastName?: string) =>
      post<{ userId: string }>("/api/auth/register", { email, password, name, firstName, lastName }),
    logout: () => post<void>("/api/auth/logout", {}),
    refresh: (refreshToken: string) =>
      post<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", { refreshToken }),
  },

  // -- Users -----------------------------------------------------------------
  users: {
    me: () => get<Record<string, unknown>>("/api/users/me"),
    updateMe: (data: { name?: string; firstName?: string; lastName?: string; bio?: string }) =>
      patch<Record<string, unknown>>("/api/users/me", data),
    updateContacts: (contacts: { type: string; value: string }[]) =>
      put<void>("/api/users/me/contacts", { contacts }),
    getById: (id: string) => get<Record<string, unknown>>(`/api/users/${id}`),
    searchByEmail: (email: string) =>
      get<Record<string, unknown>>(`/api/users/search?email=${encodeURIComponent(email)}`),
  },

  // -- Workspaces ------------------------------------------------------------
  workspaces: {
    list: () => get<unknown[]>("/api/workspaces"),
    create: (name: string) => post<Record<string, unknown>>("/api/workspaces", { name }),
    get: (id: string) => get<Record<string, unknown>>(`/api/workspaces/${id}`),
    update: (id: string, name: string) => patch<Record<string, unknown>>(`/api/workspaces/${id}`, { name }),
    addAdmin: (wsId: string, userId: string) =>
      post<void>(`/api/workspaces/${wsId}/admins`, { userId }),
    removeAdmin: (wsId: string, userId: string) =>
      del<void>(`/api/workspaces/${wsId}/admins/${userId}`),
    listProjects: (wsId: string) => get<unknown[]>(`/api/workspaces/${wsId}/projects`),
  },

  // -- Projects --------------------------------------------------------------
  projects: {
    create: (workspaceId: string, name: string, description?: string) =>
      post<Record<string, unknown>>("/api/projects", { workspaceId, name, description }),
    get: (id: string) => get<Record<string, unknown>>(`/api/projects/${id}`),
    update: (id: string, data: { name?: string; description?: string }) =>
      patch<Record<string, unknown>>(`/api/projects/${id}`, data),
    delete: (id: string) => del(`/api/projects/${id}`),
    listTeams: (projectId: string) => get<unknown[]>(`/api/projects/${projectId}/teams`),
  },

  // -- Teams -----------------------------------------------------------------
  teams: {
    mine: () => get<unknown[]>("/api/teams/mine"),
    get: (id: string) => get<Record<string, unknown>>(`/api/teams/${id}`),
    create: (projectId: string, workspaceId: string, name: string) =>
      post<Record<string, unknown>>("/api/teams", { projectId, workspaceId, name }),
    invite: (teamId: string, userId: string) =>
      post<void>(`/api/teams/${teamId}/invite`, { userId }),
    acceptInvite: (teamId: string) =>
      post<void>(`/api/teams/${teamId}/invite/accept`, {}),
    rejectInvite: (teamId: string) =>
      post<void>(`/api/teams/${teamId}/invite/reject`, {}),
    setRole: (teamId: string, userId: string, role: string) =>
      patch<void>(`/api/teams/${teamId}/members/${userId}/role`, { role }),
    removeMember: (teamId: string, userId: string) =>
      del(`/api/teams/${teamId}/members/${userId}`),
    setDisplayName: (teamId: string, displayName: string) =>
      put<void>(`/api/teams/${teamId}/display-name`, { displayName }),
  },

  // -- Tasks -----------------------------------------------------------------
  tasks: {
    list: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/tasks`),
    get: (id: string) => get<Record<string, unknown>>(`/api/tasks/${id}`),
    create: (data: Record<string, unknown>) => post<Record<string, unknown>>("/api/tasks", data),
    update: (id: string, data: Record<string, unknown>) =>
      patch<Record<string, unknown>>(`/api/tasks/${id}`, data),
    delete: (id: string) => del(`/api/tasks/${id}`),
    addAttachment: (taskId: string, label: string, url: string) =>
      post<Record<string, unknown>>(`/api/tasks/${taskId}/attachments`, { label, url }),
    removeAttachment: (taskId: string, attachmentId: string) =>
      del(`/api/tasks/${taskId}/attachments/${attachmentId}`),
    addSubtask: (taskId: string, data: Record<string, unknown>) =>
      post<Record<string, unknown>>(`/api/tasks/${taskId}/subtasks`, data),
    updateSubtask: (taskId: string, subtaskId: string, data: Record<string, unknown>) =>
      patch<Record<string, unknown>>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, data),
    deleteSubtask: (taskId: string, subtaskId: string) =>
      del(`/api/tasks/${taskId}/subtasks/${subtaskId}`),
  },

  // -- Evaluations -----------------------------------------------------------
  evaluations: {
    list: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/evaluations`),
    mine: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/evaluations/my`),
    submit: (data: Record<string, unknown>) =>
      post<Record<string, unknown>>("/api/evaluations", data),
    getRubric: (teamId: string) => get<Record<string, unknown>>(`/api/teams/${teamId}/rubric`),
    updateRubric: (teamId: string, weights: Record<string, number>) =>
      put<Record<string, unknown>>(`/api/teams/${teamId}/rubric`, weights),
  },

  // -- Meetings --------------------------------------------------------------
  meetings: {
    list: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/meetings`),
    create: (data: Record<string, unknown>) =>
      post<Record<string, unknown>>("/api/meetings", data),
    update: (id: string, data: Record<string, unknown>) =>
      patch<Record<string, unknown>>(`/api/meetings/${id}`, data),
    delete: (id: string) => del(`/api/meetings/${id}`),
  },

  // -- Notifications ---------------------------------------------------------
  notifications: {
    list: () => get<unknown[]>("/api/notifications"),
    markRead: (id: string) => patch<void>(`/api/notifications/${id}/read`, {}),
    markAllRead: () => patch<void>("/api/notifications/read-all", {}),
  },

  // -- Chat ------------------------------------------------------------------
  chat: {
    listChannels: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/chat/channels`),
    createChannel: (teamId: string, name: string) =>
      post<Record<string, unknown>>("/api/chat/channels", { teamId, name }),
    listMessages: (channelId: string, limit?: number, before?: string) => {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (before) params.set("before", before);
      const qs = params.toString();
      return get<unknown[]>(`/api/chat/channels/${channelId}/messages${qs ? `?${qs}` : ""}`);
    },
    renameChannel: (channelId: string, name: string) =>
      patch<Record<string, unknown>>(`/api/chat/channels/${channelId}`, { name }),
    deleteChannel: (channelId: string) => del(`/api/chat/channels/${channelId}`),
    sendMessage: (channelId: string, teamId: string, content: string, mentions?: string[]) =>
      post<Record<string, unknown>>("/api/chat/messages", { channelId, teamId, content, mentions }),
    deleteMessage: (messageId: string) => del(`/api/chat/messages/${messageId}`),
  },

  // -- Tickets ---------------------------------------------------------------
  tickets: {
    list: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/tickets`),
    create: (data: Record<string, unknown>) =>
      post<Record<string, unknown>>("/api/tickets", data),
    updateStatus: (id: string, status: string) =>
      patch<Record<string, unknown>>(`/api/tickets/${id}/status`, { status }),
    addMessage: (ticketId: string, content: string) =>
      post<Record<string, unknown>>(`/api/tickets/${ticketId}/messages`, { content }),
  },

  // -- Links -----------------------------------------------------------------
  links: {
    list: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/links`),
    create: (data: Record<string, unknown>) =>
      post<Record<string, unknown>>("/api/links", data),
    update: (id: string, data: Record<string, unknown>) =>
      patch<Record<string, unknown>>(`/api/links/${id}`, data),
    delete: (id: string) => del(`/api/links/${id}`),
    listTags: (teamId: string) => get<unknown[]>(`/api/teams/${teamId}/tags`),
    createTag: (teamId: string, name: string, color: string) =>
      post<Record<string, unknown>>("/api/links/tags", { teamId, name, color }),
  },
};

// ---------------------------------------------------------------------------
// Token helpers (used by authStore)
// ---------------------------------------------------------------------------

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("llp_access_token", accessToken);
  localStorage.setItem("llp_refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("llp_access_token");
  localStorage.removeItem("llp_refresh_token");
}

export function getSavedRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("llp_refresh_token");
}
