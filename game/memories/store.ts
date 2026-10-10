import { create } from "zustand";
import { MEMORIES } from "./catalog";
import { completeProgress, readProgress, writeProgress, type MemoryProgress } from "./progress";
import { pressedKeys, useInput } from "../input";

type Phase = "room" | "entering" | "memory" | "leaving";
type MemoryState = {
  phase: Phase;
  activeId: string | null;
  progress: MemoryProgress;
  loaded: boolean;
  storageError: string | null;
  storageReadable: boolean;
  load: () => void;
  enter: (id: string) => void;
  finishTransition: () => void;
  complete: (score: number) => void;
  leave: () => void;
  retrySave: () => void;
};

function clearMovement() {
  pressedKeys.clear();
  useInput.getState().setMove(0, 0);
}

export const useMemories = create<MemoryState>((set, get) => ({
  phase: "room",
  activeId: null,
  progress: {},
  loaded: false,
  storageError: null,
  storageReadable: true,
  load: () => {
    if (get().loaded) return;
    try { set({ progress: readProgress(window.localStorage), loaded: true }); }
    catch { set({ loaded: true, storageReadable: false, storageError: "Dein Spielstand konnte nicht gelesen werden. Neue Erinnerungen bleiben vorerst nur für diese Sitzung erhalten." }); }
  },
  enter: (id) => {
    if (get().phase !== "room" || !get().loaded || !MEMORIES.some((memory) => memory.id === id && memory.enabled)) return;
    clearMovement();
    set({ phase: "entering", activeId: id });
  },
  finishTransition: () => {
    clearMovement();
    if (get().phase === "entering") set({ phase: "memory" });
    else if (get().phase === "leaving") set({ phase: "room", activeId: null });
  },
  complete: (score) => {
    const state = get();
    if (state.phase !== "memory" || !state.activeId || !Number.isFinite(score) || score < 0) return;
    const progress = completeProgress(state.progress, state.activeId, score);
    set({ progress });
    if (state.storageReadable) {
      try { writeProgress(window.localStorage, progress); set({ storageError: null }); }
      catch { set({ storageError: "Speichern ist gerade nicht möglich. Deine Erinnerung bleibt in dieser Sitzung erhalten." }); }
    }
    clearMovement();
    set({ phase: "leaving" });
  },
  leave: () => {
    if (get().phase !== "memory") return;
    clearMovement();
    set({ phase: "leaving" });
  },
  retrySave: () => {
    try {
      // Leseprobleme erst beheben; einen unbekannten Spielstand niemals überschreiben.
      const saved = readProgress(window.localStorage);
      const merged = { ...saved, ...get().progress };
      for (const [id, value] of Object.entries(saved)) {
        if (merged[id]) merged[id] = { ...merged[id], bestScore: Math.max(value.bestScore, merged[id].bestScore), visits: Math.max(value.visits, merged[id].visits) };
      }
      writeProgress(window.localStorage, merged);
      set({ progress: merged, storageError: null, storageReadable: true });
    } catch { set({ storageError: "Speichern ist weiterhin nicht möglich. Bitte erlaube lokale Browserdaten für dieses Spiel." }); }
  },
}));
