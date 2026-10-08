import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";
const ACCESS_KEY = "kram.accessToken";
const REFRESH_KEY = "kram.refreshToken";

export type User = { id: string; fullName: string; email: string };
export type Project = { id: string; name: string; description: string; status: string; startDate: string; endDate: string };
export type Task = { id: string; projectId: string; name: string; description: string; priority: "low" | "medium" | "high"; status: "pending" | "in_progress" | "completed"; dueDate: string };
export type Dashboard = { statistics: { totalProjects: number; totalTasks: number; completedTasks: number; pendingTasks: number; projectsInProgress: number } };

type AuthResponse = { user: User; accessToken: string; refreshToken?: string };
type ApiEnvelope<T> = { data: T; message?: string };

async function saveSession(result: AuthResponse) {
  await SecureStore.setItemAsync(ACCESS_KEY, result.accessToken);
  if (result.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, result.refreshToken);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  const headers = { "Content-Type": "application/json", "X-Client": "mobile", ...(options.headers || {}) } as Record<string, string>;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Unable to reach KRAM. Check your network connection.");
  }

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client": "mobile" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshResponse.ok) {
        const refreshed = (await refreshResponse.json()) as ApiEnvelope<AuthResponse>;
        await saveSession(refreshed.data);
        return request<T>(path, options, false);
      }
    }
    await clearSession();
    throw new Error("Your session expired. Please sign in again.");
  }

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & { message?: string };
  if (!response.ok) throw new Error(body.message || "Request failed. Please try again.");
  return body.data;
}

export async function login(email: string, password: string) {
  const result = await request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  await saveSession(result);
  return result.user;
}

export async function register(fullName: string, email: string, password: string) {
  const result = await request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ fullName, email, password }) }, false);
  await saveSession(result);
  return result.user;
}

export async function restoreSession() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshToken) return null;
  const result = await request<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }, false);
  await saveSession(result);
  return result.user;
}

export async function logout() {
  try { await request<null>("/auth/logout", { method: "POST" }, false); } finally { await clearSession(); }
}

export const api = {
  dashboard: () => request<Dashboard>("/dashboard"),
  projects: () => request<Project[]>("/projects"),
  tasks: (query = "") => request<Task[]>(`/tasks${query ? `?${query}` : ""}`),
  createTask: (body: object) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id: string, body: object) => request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  completeTask: (id: string) => request<Task>(`/tasks/${id}/complete`, { method: "PATCH" }),
  deleteTask: (id: string) => request<{ id: string }>(`/tasks/${id}`, { method: "DELETE" }),
};
