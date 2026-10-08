import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, UserResponse } from "@/services/authApi";
import { projectApi, ProjectData, ProjectInput } from "@/services/projectApi";
import { taskApi, TaskData, TaskInput } from "@/services/taskApi";
import { activityApi, ActivityData } from "@/services/activityApi";
import { userApi } from "@/services/userApi";
import { seedFor } from "./seed";

export type ProjectStatus = "not_started" | "in_progress" | "completed";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type Priority = "low" | "medium" | "high";

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string | undefined;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  createdDate: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  createdDate: string;
  tags: string[];
}

export interface Activity {
  id: string;
  userId: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface Prefs {
  notifications: boolean;
  compact: boolean;
  theme: ThemeName;
  dark: boolean;
  unlockedBadges: string[];
}

interface State {
  currentUser: User | null;
  currentUserId: string | null;
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  prefs: Record<string, Prefs>;
  hydrated: boolean;
  loading: boolean;

  initAuth: () => Promise<void>;
  fetchWorkspaceData: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User | "duplicate">;
  logout: () => Promise<void>;
  updateProfile: (p: { fullName: string; email: string; avatar?: string | undefined }) => Promise<boolean>;
  setPrefs: (p: Partial<Prefs>) => void;
  resetDemo: () => Promise<void>;

  createProject: (p: ProjectInput) => Promise<Project>;
  updateProject: (id: string, p: Partial<ProjectInput>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  createTask: (t: TaskInput) => Promise<Task>;
  updateTask: (id: string, t: Partial<TaskInput>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<TaskStatus | null>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  setTaskDue: (id: string, dueDate: string) => Promise<void>;
}

export const defaultPrefs: Prefs = {
  notifications: true,
  compact: false,
  theme: "terracotta",
  dark: false,
  unlockedBadges: [],
};

export const THEMES = ["terracotta", "ocean", "forest", "grape"] as const;
export type ThemeName = (typeof THEMES)[number];
export const themeMeta: Record<ThemeName, { label: string; swatch: string[] }> = {
  terracotta: { label: "Terracotta", swatch: ["oklch(0.58 0.13 40)", "oklch(0.93 0.035 75)", "oklch(0.57 0.07 125)"] },
  ocean: { label: "Ocean", swatch: ["oklch(0.55 0.11 230)", "oklch(0.9 0.035 210)", "oklch(0.6 0.08 190)"] },
  forest: { label: "Forest", swatch: ["oklch(0.55 0.1 150)", "oklch(0.91 0.04 130)", "oklch(0.6 0.08 110)"] },
  grape: { label: "Grape", swatch: ["oklch(0.55 0.14 315)", "oklch(0.9 0.04 320)", "oklch(0.6 0.08 170)"] },
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};
export const taskStatusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};
export const priorityLabel: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
export const priorityRank: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export const sleep = (ms = 450) => new Promise((r) => setTimeout(r, ms));
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const useKram = create<State>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentUserId: null,
      projects: [],
      tasks: [],
      activities: [],
      prefs: {},
      hydrated: false,
      loading: false,

      initAuth: async () => {
        try {
          // Attempt silent refresh or get current user
          const userRes = await authApi.refresh().catch(() => null);
          if (userRes && userRes.user) {
            set({
              currentUser: userRes.user,
              currentUserId: userRes.user.id,
            });
            await get().fetchWorkspaceData();
          } else {
            set({ currentUser: null, currentUserId: null });
          }
        } catch {
          set({ currentUser: null, currentUserId: null });
        } finally {
          set({ hydrated: true });
        }
      },

      fetchWorkspaceData: async () => {
        const uid = get().currentUserId;
        if (!uid) return;
        set({ loading: true });
        try {
          const [projects, tasks, activities] = await Promise.all([
            projectApi.getProjects(),
            taskApi.getTasks(),
            activityApi.getActivities(),
          ]);
          set({
            projects: projects as Project[],
            tasks: tasks as Task[],
            activities: activities as Activity[],
          });
        } catch (error) {
          console.error("Failed to load workspace data:", error);
          set(seedFor(uid));
        } finally {
          set({ loading: false });
        }
      },

      login: async (email, password) => {
        const res = await authApi.login(email.trim().toLowerCase(), password);
        const user: User = res.user;
        set({ currentUser: user, currentUserId: user.id });
        await get().fetchWorkspaceData();
        return user;
      },

      register: async (fullName, email, password) => {
        try {
          const res = await authApi.register(fullName, email, password);
          const user: User = res.user;
          set({
            currentUser: user,
            currentUserId: user.id,
            projects: [],
            tasks: [],
            activities: [
              {
                id: uid(),
                userId: user.id,
                type: "ACCOUNT_CREATED",
                message: "Created KRAM workspace",
                createdAt: new Date().toISOString(),
              },
            ],
          });
          await get().fetchWorkspaceData();
          return user;
        } catch (err: any) {
          if (err.statusCode === 409 || err.message?.includes("already exists")) {
            return "duplicate";
          }
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore
        } finally {
          set({
            currentUser: null,
            currentUserId: null,
            projects: [],
            tasks: [],
            activities: [],
          });
        }
      },

      updateProfile: async (p) => {
        try {
          const updated = await userApi.updateProfile(p);
          set({
            currentUser: updated,
          });
          // Refresh activities to see profile update event
          const activities = await activityApi.getActivities();
          set({ activities: activities as Activity[] });
          return true;
        } catch {
          return false;
        }
      },

      setPrefs: (p) => {
        const id = get().currentUserId;
        if (!id) return;
        set((s) => ({
          prefs: { ...s.prefs, [id]: { ...defaultPrefs, ...s.prefs[id], ...p } },
        }));
      },

      resetDemo: async () => {
        // User reset feature
        await get().fetchWorkspaceData();
      },

      createProject: async (p) => {
        const created = await projectApi.createProject(p);
        const newProject = created as Project;
        set((s) => ({ projects: [newProject, ...s.projects] }));
        // Refresh activities
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
        return newProject;
      },

      updateProject: async (id, p) => {
        const updated = await projectApi.updateProject(id, p);
        set((s) => ({
          projects: s.projects.map((x) => (x.id === id ? (updated as Project) : x)),
        }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
      },

      deleteProject: async (id) => {
        await projectApi.deleteProject(id);
        set((s) => ({
          projects: s.projects.filter((x) => x.id !== id),
          tasks: s.tasks.filter((t) => t.projectId !== id),
        }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
      },

      createTask: async (t) => {
        const created = await taskApi.createTask(t);
        const newTask = created as Task;
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
        return newTask;
      },

      updateTask: async (id, t) => {
        const updated = await taskApi.updateTask(id, t);
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? (updated as Task) : x)),
        }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
      },

      deleteTask: async (id) => {
        await taskApi.deleteTask(id);
        set((s) => ({
          tasks: s.tasks.filter((x) => x.id !== id),
        }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
      },

      setTaskStatus: async (id, status) => {
        const updated = await taskApi.updateTask(id, { status });
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? (updated as Task) : x)),
        }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
      },

      setTaskDue: async (id, dueDate) => {
        const updated = await taskApi.updateTask(id, { dueDate });
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? (updated as Task) : x)),
        }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
      },

      toggleTask: async (id) => {
        const task = get().tasks.find((x) => x.id === id);
        if (!task) return null;
        const newStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
        const updated = newStatus === "completed"
          ? await taskApi.completeTask(id)
          : await taskApi.updateTask(id, { status: "pending" });

        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? (updated as Task) : x)),
        }));
        activityApi.getActivities().then((acts) => set({ activities: acts as Activity[] })).catch(() => {});
        return newStatus;
      },
    }),
    {
      name: "kram-store-prefs-v1",
      partialize: (state) => ({ prefs: state.prefs }),
    }
  )
);

// Scoped Selectors
export function useCurrentUser(): User | null {
  return useKram((s) => s.currentUser);
}
export function useMyProjects(): Project[] {
  return useKram((s) => s.projects);
}
export function useMyTasks(): Task[] {
  return useKram((s) => s.tasks);
}
export function useMyActivities(): Activity[] {
  return useKram((s) => s.activities);
}
export function usePrefs(): Prefs {
  const uid = useKram((s) => s.currentUserId);
  const prefs = useKram((s) => (uid ? s.prefs[uid] : undefined));
  return { ...defaultPrefs, ...prefs };
}
export function useAllTags(): string[] {
  const tasks = useMyTasks();
  return [...new Set(tasks.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b));
}
