export type MemoryDefinition = {
  id: string;
  name: string;
  enabled: boolean;
  scene: "shooting" | "dog-arrival";
  heading: string;
  object: {
    name: string;
    x: number;
    y: number;
    approach: { x: number; y: number };
    radius: number;
  };
  roomEffect: "shooting-medal" | "dog-companion";
};

export const MEMORIES: readonly MemoryDefinition[] = [
  {
    id: "goelzau-shooting",
    name: "Schießen in Gölzau",
    enabled: true,
    scene: "shooting",
    heading: "Eine Erinnerung an Gölzau …",
    object: {
      name: "Foto vom Schießstand",
      x: 0.855,
      y: 0.49,
      approach: { x: 0.8, y: 0.59 },
      radius: 0.12,
    },
    roomEffect: "shooting-medal",
  },
  // Erst aktivieren, wenn die eigene Hundeszene und ihr Zimmer-Effekt existieren.
  {
    id: "dog-arrival",
    name: "Der Tag, an dem du kamst",
    enabled: false,
    scene: "dog-arrival",
    heading: "Manchmal beginnt Glück auf vier Pfoten …",
    object: {
      name: "Ein kleines Halsband",
      x: 0.4,
      y: 0.23,
      approach: { x: 0.43, y: 0.38 },
      radius: 0.1,
    },
    roomEffect: "dog-companion",
  },
];

export function nearestMemory(position: { x: number; y: number }) {
  return MEMORIES.filter((memory) => memory.enabled)
    .map((memory) => ({ memory, distance: Math.hypot(position.x - memory.object.approach.x, position.y - memory.object.approach.y) }))
    .filter(({ memory, distance }) => distance <= memory.object.radius)
    .sort((a, b) => a.distance - b.distance)[0]?.memory;
}
