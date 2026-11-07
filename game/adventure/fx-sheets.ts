/**
 * Sprite sheets rendered with Blender (scripts/blender/render_fx.py → public/fx/*.png).
 * One row of square frames each; frames and size must match the render script (checked by tests).
 */
export const FX = {
  fragment: { src: "/fx/fragment.png", frames: 16, size: 96, ms: 1100, loop: true },
  "shadow-dissolve": { src: "/fx/shadow-dissolve.png", frames: 24, size: 128, ms: 1700, loop: false },
  "heart-burst": { src: "/fx/heart-burst.png", frames: 20, size: 96, ms: 1500, loop: false },
} as const;
export type FxName = keyof typeof FX;
