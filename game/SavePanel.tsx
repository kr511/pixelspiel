"use client";

import { useEffect, useRef, useState } from "react";
import { exportSave, importSave, parseSaveFile, summarize, type SaveFile } from "./savefile";
import { historicalDate } from "./timeline";

/** Save file export and import. Importing replaces local progress, so it is only applied after a visible confirmation. */
export function SavePanel({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<SaveFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { const node = dialog.current; if (node && !node.open) node.showModal(); return () => { if (node?.open) node.close(); }; }, []);
  const download = () => {
    try {
      const file = exportSave(window.localStorage);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
      link.download = `felice-elias-spielstand-${file.exportedAt.slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setMessage("Spielstand gespeichert. Bewahre die Datei gut auf.");
    } catch { setMessage("Der Spielstand konnte nicht gespeichert werden."); }
  };
  const choose = async (file: File | undefined) => {
    setPending(null);
    if (!file) return;
    try { setPending(parseSaveFile(await file.text())); setMessage(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Die Datei konnte nicht gelesen werden."); }
  };
  const apply = () => {
    if (!pending) return;
    try { importSave(window.localStorage, pending); window.location.reload(); }
    catch { setMessage("Der Spielstand konnte nicht übernommen werden. Dein bisheriger Stand ist unverändert."); setPending(null); }
  };
  const summary = pending ? summarize(pending) : null;
  return <dialog ref={dialog} className="story-modal inventory-modal" data-testid="save-panel" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="inventory-heading"><div><small>SPIELSTAND</small><h1>Sichern und laden</h1></div><button className="modal-close" aria-label="Schließen" onClick={onClose}>×</button></div>
    <div className="inventory-body">
      <article className="inventory-detail">
        <h2>Speichern</h2>
        <p>Lädt deinen Fortschritt als Datei herunter. So kannst du ihn auf ein anderes Gerät oder in eine andere Spielversion mitnehmen.</p>
        <button className="memory-primary" onClick={download}>Spielstand speichern</button>
      </article>
      <article className="inventory-detail">
        <h2>Laden</h2>
        <p>Ersetzt den Fortschritt auf diesem Gerät durch den Inhalt der Datei. Ungültige Dateien werden abgelehnt, bevor etwas verändert wird.</p>
        <input type="file" accept="application/json,.json" aria-label="Spielstand-Datei auswählen" onChange={event => { void choose(event.target.files?.[0]); event.target.value = ""; }}/>
        {pending && summary && <div role="alert"><p>{summary.gameDate ? `Spielzeit ${historicalDate(summary.gameDate)}` : "Ohne Kalenderstand"} · {summary.memories} Erinnerungen · {summary.names} eigene Namen</p><p>Dein aktueller Fortschritt auf diesem Gerät wird ersetzt.</p><button className="memory-primary" onClick={apply}>Ja, ersetzen</button> <button className="memory-secondary" onClick={() => setPending(null)}>Abbrechen</button></div>}
      </article>
    </div>
    <div className="journal-bottom"><small role="status">{message ?? "Die Datei enthält nur Spielfortschritt, keine persönlichen Daten außer deinen eigenen Namen für Figuren."}</small><button className="memory-primary" onClick={onClose}>Zurück ins Spiel</button></div>
  </dialog>;
}
