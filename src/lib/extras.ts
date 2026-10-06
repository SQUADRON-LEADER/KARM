import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./store";

export interface Subtask { id: string; title: string; done: boolean }
export interface Note { id: string; text: string; createdAt: string }
export interface FocusTimer { taskId: string | null; taskName: string; mode: "focus" | "break"; endsAt: number | null; remaining: number; total: number }

interface Extras {
  subtasks: Record<string, Subtask[]>; // by taskId
  notes: Record<string, Note[]>; // by projectId
  focusMinutes: Record<string, number>; // by taskId
  tourDone: Record<string, boolean>; // by userId
  sound: boolean;
  sidebarCollapsed: boolean;
  timer: FocusTimer | null;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, id: string) => void;
  removeSubtask: (taskId: string, id: string) => void;
  addNote: (projectId: string, text: string) => void;
  removeNote: (projectId: string, id: string) => void;
  logFocus: (taskId: string, mins: number) => void;
  setTourDone: (userId: string, v: boolean) => void;
  setSound: (v: boolean) => void;
  toggleSidebar: () => void;
  setTimer: (t: FocusTimer | null) => void;
}

export const useExtras = create<Extras>()(
  persist(
    (set) => ({
      subtasks: {}, notes: {}, focusMinutes: {}, tourDone: {}, sound: true, sidebarCollapsed: false, timer: null,
      addSubtask: (taskId, title) => set((s) => ({ subtasks: { ...s.subtasks, [taskId]: [...(s.subtasks[taskId] ?? []), { id: uid(), title, done: false }] } })),
      toggleSubtask: (taskId, id) => set((s) => ({ subtasks: { ...s.subtasks, [taskId]: (s.subtasks[taskId] ?? []).map((x) => (x.id === id ? { ...x, done: !x.done } : x)) } })),
      removeSubtask: (taskId, id) => set((s) => ({ subtasks: { ...s.subtasks, [taskId]: (s.subtasks[taskId] ?? []).filter((x) => x.id !== id) } })),
      addNote: (projectId, text) => set((s) => ({ notes: { ...s.notes, [projectId]: [{ id: uid(), text, createdAt: new Date().toISOString() }, ...(s.notes[projectId] ?? [])] } })),
      removeNote: (projectId, id) => set((s) => ({ notes: { ...s.notes, [projectId]: (s.notes[projectId] ?? []).filter((x) => x.id !== id) } })),
      logFocus: (taskId, mins) => set((s) => ({ focusMinutes: { ...s.focusMinutes, [taskId]: (s.focusMinutes[taskId] ?? 0) + mins } })),
      setTourDone: (userId, v) => set((s) => ({ tourDone: { ...s.tourDone, [userId]: v } })),
      setSound: (v) => set({ sound: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTimer: (timer) => set({ timer }),
    }),
    { name: "kram-extras-v1", skipHydration: true, partialize: ({ timer, ...rest }) => ({ ...rest, timer }) },
  ),
);

const EMPTY: Subtask[] = [];
export const useSubtasks = (taskId: string) => useExtras((s) => s.subtasks[taskId] ?? EMPTY);

/** Tiny WebAudio sound effects — no files needed. */
let ctx: AudioContext | null = null;
export function playSound(kind: "done" | "badge" | "tick" | "timer") {
  if (typeof window === "undefined" || !useExtras.getState().sound) return;
  try {
    ctx ??= new AudioContext();
    const notes = { done: [660, 880], badge: [523, 659, 784, 1047], tick: [1200], timer: [880, 660, 880] }[kind];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      const t = ctx!.currentTime + i * 0.09;
      o.type = kind === "tick" ? "square" : "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(kind === "tick" ? 0.03 : 0.12, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "tick" ? 0.05 : 0.25));
      o.connect(g).connect(ctx!.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch { /* audio unavailable */ }
}
