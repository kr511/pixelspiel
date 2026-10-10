"use client";

import { useEffect, useRef, useState } from "react";
import { inventoryItems } from "./inventory";

/** Felice's bag: story items to look at. Nothing here can be dropped or used up. */
export function InventoryPanel({ ids, onClose, onOpenMemory }: { ids: string[]; onClose: () => void; onOpenMemory: () => void }) {
  const items = inventoryItems(ids);
  const [selected, setSelected] = useState(items[0]?.id ?? null);
  const item = items.find(entry => entry.id === selected);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; if (node && !node.open) node.showModal(); return () => { if (node?.open) node.close(); }; }, []);
  return <dialog ref={dialog} className="story-modal inventory-modal" data-testid="inventory" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => { if (event.code === "KeyI") { event.preventDefault(); onClose(); } }}>
    <div className="inventory-heading"><div><small>FELICES TASCHE</small><h1>Dinge, die bleiben</h1></div><button className="modal-close" aria-label="Tasche schließen" onClick={onClose}>×</button></div>
    {items.length ? <div className="inventory-body">
      <ul className="inventory-grid" aria-label="Gegenstände">{items.map(entry => <li key={entry.id}><button aria-pressed={entry.id === selected} onClick={() => setSelected(entry.id)}><span aria-hidden="true">{entry.symbol}</span><small>{entry.name}</small></button></li>)}</ul>
      {item && <article className="inventory-detail" aria-live="polite"><span className="inventory-symbol" aria-hidden="true">{item.symbol}</span><small>{item.category}</small><h2>{item.name}</h2><p>{item.description}</p>{item.memoryId && <button className="memory-secondary" onClick={onOpenMemory}>Erinnerung im Album ansehen</button>}</article>}
    </div> : <p className="inventory-empty">Noch ist die Tasche leer. Erinnerungsstücke, Briefe und Geschenke aus eurer Geschichte finden hier ihren Platz.</p>}
    <div className="journal-bottom"><small>Gegenstände verschwinden nur, wenn die Geschichte es vorsieht. Wiederholte Erinnerungen verändern die Tasche nicht.</small><button className="memory-primary" onClick={onClose}>Zurück ins Spiel</button></div>
  </dialog>;
}
