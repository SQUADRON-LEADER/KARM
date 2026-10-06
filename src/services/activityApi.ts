import { api } from "./api";

export interface ActivityData {
  id: string;
  userId: string;
  type: string;
  message: string;
  metadata?: any;
  createdAt: string;
}

export const activityApi = {
  getActivities: async (page = 1, limit = 50): Promise<ActivityData[]> => {
    return api.get<ActivityData[]>(`/activities?page=${page}&limit=${limit}`);
  },
};
