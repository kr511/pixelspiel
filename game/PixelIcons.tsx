// Small pixel icons for the diary-style interface; drawn on a 12×12 grid so they stay crisp.
export type PixelIconName = "book" | "phone" | "menu" | "bag" | "talk" | "arrow";

const PATHS: Record<PixelIconName, { d: string; fill: string }[]> = {
  book: [{ d: "M1 2h4v1h1v1h0V3h1V2h4v8H7v1H5v-1H1z", fill: "var(--px-rose)" }, { d: "M2 3h3v1h1v5H5V8H2zM10 3H7v1H6v5h1V8h3z", fill: "#FBE7EB" }],
  phone: [{ d: "M3 1h6v10H3z", fill: "var(--px-ink)" }, { d: "M4 2h4v7H4z", fill: "#BFD4E6" }, { d: "M5 10h2v1H5z", fill: "var(--px-paper)" }],
  menu: [{ d: "M2 3h8v1H2zM2 6h8v1H2zM2 9h8v1H2z", fill: "var(--px-ink)" }],
  bag: [{ d: "M4 1h4v1h1v2h2v7H1V4h2V2h1zM4 2v2h4V2z", fill: "var(--px-ink)" }, { d: "M2 5h8v5H2z", fill: "#D9A441" }],
  talk: [{ d: "M2 2h8v6H6L4 10V8H2z", fill: "currentColor" }],
  arrow: [{ d: "M5 1h2v2h2v2h2v2H9v2H7v2H5V9h2V7H1V5h6V3H5z", fill: "currentColor" }],
};

export function PixelIcon({ name, size = 22 }: { name: PixelIconName; size?: number }) {
  return <svg className="pixel-icon" width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">{PATHS[name].map(path => <path key={path.d} d={path.d} fill={path.fill}/>)}</svg>;
}
