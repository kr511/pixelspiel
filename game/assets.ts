/** Resolve public assets for both root hosting and a GitHub Pages project path. */
export function assetUrl(source: string, base = import.meta.env?.BASE_URL ?? "/"): string {
  if (!source.startsWith("/") || source.startsWith("//")) return source;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${source.slice(1)}`;
}
