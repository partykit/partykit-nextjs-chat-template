import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import { syncedStore, getYjsDoc } from "@syncedstore/core";

type Lineage = string[];

type Lineages = {
  [key: string]: Lineage;
};

type PopulatedCell = {
  lineage: string;
  index: number;
  emoji: string;
};

export type Cell = PopulatedCell | null;

// Garden is a map of index to cell
// The index is left to right, top to bottom
export type Garden = {
  [key: number]: Cell;
};

export const gardenDimensions = {
  width: 10,
  height: 10,
};

const lineages = {
  deciduous: ["🌱", "🌳", "🌳", "🌳", "🌳", "🌳", "🍂", "🐌"],
  evergreen: ["🌰", "🌲", "🌲", "🌲", "🌲", "🌲", "🍃"],
  squirrel: ["🌰", "🌰", "🌰", "🐿️", "🐿️"],
  sprout: ["🌱", "🌱", "🌱", "🌱", "🍄", "🍄", "🍄", "🦌", "🦌"],
  flower: ["🌱", "🌱", "🌸", "🌸", "🌸", "🌸", "🌸", "🌸", "🐝", "🐝"],
  fern: [
    "🌿",
    "🌿",
    "🌿",
    "🌿",
    "🌿",
    "🌿",
    "🌿",
    "🌿",
    "🐻",
    "🐻",
    "👣",
    "👣",
  ],
} as Lineages;

export const yDocShape = { garden: {} as Garden };

export const getStarterEmojis = () => {
  // returns a list of { lineage, emoji } objects where the emoji is the
  // first emoji in the lineage
  return Object.keys(lineages).map((lineage) => {
    return {
      lineage,
      index: 0,
      emoji: lineages[lineage][0],
    };
  }) as Cell[];
};

const GARDEN_TICK = 1500; // milliseconds

export default class GardenServer implements Party.Server {
  store: any;
  constructor(public party: Party.Party) {}
  onConnect(connection: Party.Connection) {
    return onConnect(connection, this.party, {
      persist: true,
      callback: {
        handler: async (ydoc) => {
          try {
            // We can manipulate the yDoc here... but we want to evolve it independently of the clients.
            // So we stash it on the room object, and access it later in onAlarm.
            // NOTE: This is a hack! If the number of websocket connections goes to zero, the room object
            // will be destroyed, we'll lose the yDoc, and the garden will stop evolving. There are
            // ways to persist the yDoc, but that's a task for another day.
            if (!this.store) {
              const store = syncedStore(yDocShape, ydoc);
              this.store = store;
            }
            // If there's no alarm set already, set one for the next tick
            const alarm = await this.party.storage.getAlarm();
            if (alarm === null) {
              await this.party.storage.setAlarm(
                new Date().getTime() + GARDEN_TICK
              );
            }
          } catch (e) {
            console.error("Callback error", e);
          }
        },
      },
    });
  }
  async onAlarm() {
    // We've been woken up. Load the yDoc and iterate the garden
    // NOTE: This is a hack! The store will be empty if the number of websocket connections goes to zero.
    const store = this.store;
    Object.entries(store.garden as Garden).forEach(([index, cell]) => {
      if (cell) {
        // Check the lineage and index against the lineages map
        // If the index can be incremented, increment it and update the emoji.
        // If it can't be incremented, remove the cell from the garden.
        const lineage = lineages[cell.lineage];
        if (lineage) {
          if (cell.index < lineage.length - 1) {
            cell.index++;
            cell.emoji = lineage[cell.index];
          } else {
            delete store.garden[index];
          }
        } else {
          delete store.garden[index];
        }
      }
    });

    // Set the alarm if the garden isn't already empty (all lineages tend to an empty garden,
    // given enough ticks).
    if (store.garden.size > 0) {
      await this.party.storage.setAlarm(new Date().getTime() + GARDEN_TICK);
    }
  }
}
