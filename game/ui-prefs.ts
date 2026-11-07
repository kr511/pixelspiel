export const UI_KEY = "felice-elias.ui.v1";
export type UiPrefs = { version: 1; nextStep: boolean };
export const DEFAULT_UI: UiPrefs = { version: 1, nextStep: true };
export function parseUi(raw: string | null): UiPrefs {
  if (!raw) return { ...DEFAULT_UI };
  const value = JSON.parse(raw);
  if (value?.version !== 1 || typeof value.nextStep !== "boolean") throw new Error("Unbekannte Anzeigeeinstellung");
  return { version: 1, nextStep: value.nextStep };
}
