import { api } from "./api";

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "completed";
  startDate: string;
  endDate: string;
  createdDate: string;
}

export interface ProjectInput {
  name: string;
  description?: string;
  status?: "not_started" | "in_progress" | "completed";
  startDate: string;
  endDate: string;
}

export interface ProjectQueryParams {
  search?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const projectApi = {
  getProjects: async (params?: ProjectQueryParams): Promise<ProjectData[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.sort) query.append("sort", params.sort);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.get<ProjectData[]>(`/projects${qs}`);
  },

  getProjectById: async (id: string): Promise<ProjectData> => {
    return api.get<ProjectData>(`/projects/${id}`);
  },

  createProject: async (data: ProjectInput): Promise<ProjectData> => {
    return api.post<ProjectData>("/projects", data);
  },

  updateProject: async (id: string, data: Partial<ProjectInput>): Promise<ProjectData> => {
    return api.put<ProjectData>(`/projects/${id}`, data);
  },

  deleteProject: async (id: string): Promise<{ id: string; name: string }> => {
    return api.delete<{ id: string; name: string }>(`/projects/${id}`);
  },
};
