import { PartyKitServer, PartyKitRoom } from "partykit/server";
import { onConnect } from "y-partykit";
import { syncedStore, getYjsDoc } from "@syncedstore/core";

type YJsRoom = PartyKitRoom & {
  store?: any;
};

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
//export const store = syncedStore(yDocShape);
//export const doc = getYjsDoc(store);

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

export default {
  onConnect(ws, room) {
    return onConnect(ws, room, {
      persist: true,
      callback: {
        async handler(ydoc) {
          try {
            // Stash the ydoc and set an alarm if it isn't empty
            if (!(room as YJsRoom).store) {
              const store = syncedStore(yDocShape, ydoc);
              //console.log("Stashing store", store);
              (room as YJsRoom).store = store;
            }
            // If there's no alarm set, set one for the next tick
            const alarm = await room.storage.getAlarm();
            //console.log("alarm", alarm);
            if (alarm === null) {
              //console.log("Setting alarm");
              await room.storage.setAlarm(new Date().getTime() + GARDEN_TICK);
            }
          } catch (e) {
            console.error("Callback error", e);
          }
        },
      },
    });
  },
  async onAlarm(room) {
    //console.log("onAlarm: iterating garden");
    // iterate the garden and set a new alarm if the garden isn't empty
    const store = (room as YJsRoom).store;
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

    // Set the alarm if the garden isn't empty
    if (store.garden.size > 0) {
      await room.storage.setAlarm(new Date().getTime() + GARDEN_TICK);
    }
  },
} satisfies PartyKitServer;
