// Felice's story inventory. Items are granted by StoryEvent.rewards on the first
// real completion and stored as IDs in TimelineSave.inventory. Descriptions only
// state confirmed facts; unknown details stay explicitly open.
export type InventoryCategory = "Brief" | "Geschenk" | "Foto" | "Erinnerungsstück" | "Story";
export type InventoryItem = { id: string; name: string; symbol: string; category: InventoryCategory; description: string; memoryId?: string };

export const ITEMS: Record<string, InventoryItem> = {
  chocolate: {
    id: "chocolate", name: "Elias’ Schokolade", symbol: "▦", category: "Geschenk", memoryId: "radegast-chocolate",
    description: "Elias hat sie am 16.11.2025 mit dem Fahrrad aus Zörbig zum Treffpunkt nach Radegast gebracht. Felice hat sie nicht gegessen. Im Spiel bleibt sie als Erinnerungsstück in ihrer Tasche.",
  },
  "elias-letter": {
    id: "elias-letter", name: "Ein persönlicher Brief von Elias", symbol: "✉", category: "Brief", memoryId: "morning-after-2025-12-26",
    description: "Elias’ persönlicher Brief vom Morgen nach Weihnachten. Der Originaltext liegt nicht vor und wird nicht erfunden; er kann später ergänzt werden.",
  },
};

/** Known items in the order they were earned; unknown saved IDs are kept in the save but not shown. */
export function inventoryItems(ids: string[]) { return ids.map(id => ITEMS[id]).filter((item): item is InventoryItem => Boolean(item)); }
