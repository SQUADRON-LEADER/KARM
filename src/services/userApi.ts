import { api } from "./api";
import { UserResponse } from "./authApi";

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  avatar?: string;
}

export const userApi = {
  updateProfile: async (data: UpdateUserInput): Promise<UserResponse> => {
    return api.put<UserResponse>("/users/me", data);
  },
};
