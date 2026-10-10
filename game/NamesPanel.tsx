import { useState } from "react";
import { CharacterArt } from "./WorldArt";
import { PEOPLE, displayName, type NameSave, type NameMode } from "./names";

export function NamesPanel({ save, error, onRename, onVisibility }: { save: NameSave; error: string | null; onRename: (id: string, name: string) => void; onVisibility: (mode: NameMode) => void }) {
  const [saved, setSaved] = useState<string | null>(null);
  return <section className="names-panel" aria-label="Figuren und Namen">
    <div className="names-heading"><div><h2>Menschen in deiner Welt</h2><p>Alle Freunde, Trainer und die Familie. Hier kannst du fehlende Namen ergänzen. Ein leeres Feld stellt die bisherige Bezeichnung wieder her.</p></div><label>Namensanzeige<select aria-label="Namensanzeige" value={save.visibility} onChange={event => onVisibility(event.target.value as NameMode)}><option value="always">Immer anzeigen</option><option value="nearby">Beim Nähern</option><option value="friends">Freunde immer anzeigen</option></select></label></div>
    {error && <p role="status" className="names-error">{error}</p>}
    {saved && !error && <p role="status" className="name-saved">Name übernommen: {saved}</p>}
    {([ ["school", "Freunde in der Schule"], ["gym", "Bei der Zeugnisübergabe"], ["range", "Schießfreunde und Trainer"], ["home", "Felices Familie"] ] as const).map(([place, title]) => <div className="names-group" key={place}><h3>{title}</h3><div className="names-grid">{PEOPLE.filter(person => person.place === place).map(person => <form key={person.id} className="name-card" onSubmit={event => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("name") ?? ""); onRename(person.id, value); setSaved(value.trim() || person.name); }}>
      <div className="name-avatar"><CharacterArt id={person.art} portrait/></div><label><span>{person.name}</span><input name="name" aria-label={`Name von ${person.name}`} defaultValue={displayName(person, save)} maxLength={32}/></label><button type="submit" aria-label={`Name von ${person.name} speichern`}>✓</button>
    </form>)}</div></div>)}
  </section>;
}
