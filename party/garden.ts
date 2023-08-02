import { PartyKitServer } from "partykit/server";
import { onConnect } from "y-partykit";
import { syncedStore, getYjsDoc } from "@syncedstore/core";

type Lineage = string[];

type Lineages = {
    [key: string]: Lineage;
}

type PopulatedCell = {
    lineage: string;
    index: number;
    emoji: string;
}

export type Cell = PopulatedCell | null;

// Garden is a map of index to cell
// The index is left to right, top to bottom
export type Garden = {
    [key: number]: Cell;
}

export const gardenDimensions = {
    width: 10,
    height: 10
}

const lineages = {
    deciduous: ["🌱", "🌳", "🌳", "🌳", "🌳", "🌳", "🍂", "🐌"],
    evergreen: ["🌰", "🌲", "🌲", "🌲", "🌲", "🌲", "🍃"],
    squirrel: ["🌰", "🌰", "🌰", "🐿️", "🐿️"],
    sprout: ["🌱", "🌱", "🌱", "🌱", "🍄", "🍄", "🍄", "🦌", "🦌"],
    flower: ["🌱", "🌱", "🌸", "🌸", "🌸", "🌸", "🌸", "🌸", "🐝", "🐝"],
    fern: ["🌿", "🌿", "🌿", "🌿", "🌿", "🌿", "🌿", "🌿", "🐻", "👣", "👣", "👣"]
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
            emoji: lineages[lineage][0]
        }
    }) as Cell[];
}


export default { onConnect };