import { api } from "./api";

export interface DashboardResponse {
  statistics: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    projectsInProgress: number;
    completionRate: number;
  };
  taskCompletion: {
    name: string;
    projectId: string;
    Completed: number;
    Remaining: number;
  }[];
  tasksByStatus: {
    name: string;
    status: string;
    value: number;
  }[];
  projectsByStatus: {
    name: string;
    status: string;
    value: number;
  }[];
  tasksByPriority: {
    name: string;
    priority: string;
    Open: number;
    Done: number;
  }[];
  upcomingTasks: any[];
  recentActivities: any[];
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    return api.get<DashboardResponse>("/dashboard");
  },
};
