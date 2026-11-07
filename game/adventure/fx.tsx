"use client";

import type { CSSProperties } from "react";
import { assetUrl } from "../assets";
import { FX, type FxName } from "./fx-sheets";

export { FX, type FxName };

/** Plays a sheet with CSS `steps()`; `scale` keeps the pixels crisp (whole multiples look best). */
export function FxSprite({ name, scale = 2, className = "", reduced = false }: { name: FxName; scale?: number; className?: string; reduced?: boolean }) {
  const fx = FX[name];
  const size = fx.size * scale;
  const style = {
    width: size, height: size,
    backgroundImage: `url(${assetUrl(fx.src)})`,
    backgroundSize: `${size * fx.frames}px ${size}px`,
    "--fx-end": `-${size * fx.frames}px`,
    "--fx-steps": fx.frames,
    "--fx-ms": `${fx.ms}ms`,
    // Reduced effects: hold a single, calm frame instead of animating.
    backgroundPosition: reduced ? `-${size * Math.floor(fx.frames / 3)}px 0` : undefined,
  } as CSSProperties;
  return <span className={`fx-sprite${fx.loop ? " is-loop" : ""}${reduced ? " is-still" : ""} ${className}`} style={style} aria-hidden="true"/>;
}
