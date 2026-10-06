import { api, setAccessToken } from "./api";

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
}

export const authApi = {
  register: async (fullName: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", { fullName, email, password });
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  refresh: async (): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/refresh");
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },

  getMe: async (): Promise<UserResponse> => {
    return api.get<UserResponse>("/auth/me");
  },
};
