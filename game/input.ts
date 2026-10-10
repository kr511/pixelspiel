import { create } from "zustand";

type InputState = {
  moveX: number;
  moveY: number;
  yaw: number;
  pitch: number;
  paused: boolean;
  setMove: (x: number, y: number) => void;
  rotateCamera: (x: number, y: number) => void;
  setPaused: (paused: boolean) => void;
};

export const useInput = create<InputState>((set) => ({
  moveX: 0,
  moveY: 0,
  yaw: Math.PI,
  pitch: 0.34,
  paused: true,
  setMove: (moveX, moveY) => set({ moveX, moveY }),
  rotateCamera: (x, y) => set((state) => ({
    yaw: state.yaw - x * 0.005,
    pitch: Math.max(0.12, Math.min(0.78, state.pitch + y * 0.0035)),
  })),
  setPaused: (paused) => { pressedKeys.clear(); set({ paused, moveX: 0, moveY: 0 }); },
}));

export const pressedKeys = new Set<string>();
