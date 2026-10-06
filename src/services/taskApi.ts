import { api } from "./api";

export interface TaskData {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  createdDate: string;
  tags: string[];
}

export interface TaskInput {
  projectId: string;
  name: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "pending" | "in_progress" | "completed";
  dueDate: string;
  tags?: string[];
}

export interface TaskQueryParams {
  search?: string;
  projectId?: string;
  status?: string;
  priority?: string;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const taskApi = {
  getTasks: async (params?: TaskQueryParams): Promise<TaskData[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.projectId && params.projectId !== "all") query.append("projectId", params.projectId);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.priority && params.priority !== "all") query.append("priority", params.priority);
    if (params?.tag && params.tag !== "all") query.append("tag", params.tag);
    if (params?.sort) query.append("sort", params.sort);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.get<TaskData[]>(`/tasks${qs}`);
  },

  getTaskById: async (id: string): Promise<TaskData> => {
    return api.get<TaskData>(`/tasks/${id}`);
  },

  createTask: async (data: TaskInput): Promise<TaskData> => {
    return api.post<TaskData>("/tasks", data);
  },

  updateTask: async (id: string, data: Partial<TaskInput>): Promise<TaskData> => {
    return api.put<TaskData>(`/tasks/${id}`, data);
  },

  completeTask: async (id: string): Promise<TaskData> => {
    return api.patch<TaskData>(`/tasks/${id}/complete`);
  },

  deleteTask: async (id: string): Promise<{ id: string; name: string }> => {
    return api.delete<{ id: string; name: string }>(`/tasks/${id}`);
  },
};
