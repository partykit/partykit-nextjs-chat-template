"use client";

import { useState } from "react";
import { syncedStore, getYjsDoc } from "@syncedstore/core";
import YPartyKitProvider from "y-partykit/provider";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

const yDocShape = { garden: [] as string[] };

// The initial garden is 25 empty squares
const initialGarden = [...Array(64)].map(() => "");

const emojiTrees = ["🌳", "🌲", "🌳", "🌲", "🌳", "🌲", "🌳", "🌲"];
const emojiShrubs = ["🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", "🌱", ];
const emojiForestAnimals = ["🐿️", "🦌"];
const allowedEmojis = [...emojiTrees, ...emojiShrubs, ...emojiForestAnimals];

const store = syncedStore(yDocShape);
const doc = getYjsDoc(store);

export default function Garden() {
    const [emojiToPlace, setEmojiToPlace] = useState<string | null>(null);
    const [garden, setGarden] = useState<string[]>(initialGarden);

    /*const provider = new YPartyKitProvider(
        host,
        "shared-garden",
        doc,
        {party: "garden"});*/

    const handlePlantEmoji = (i: number) => {
        if (emojiToPlace) {
            const newGarden = [...garden];
            newGarden[i] = emojiToPlace;
            setGarden(newGarden);
            setEmojiToPlace(null);
        }
    }

    const handleEmojiToPlant = () => {
        const randomEmoji = allowedEmojis[Math.floor(Math.random() * allowedEmojis.length)];
        setEmojiToPlace(randomEmoji);
    }

    return (
        <div className="flex flex-col gap-6 justify-start items-start">
            <div className="grid grid-cols-8 grid-rows-8">
                { [...Array(64)].map((_, i) => (
                    <button
                        key={i}
                        className="bg-lime-100 w-10 h-10 flex justify-center items-center disabled:bg-stone-100 hover:bg-lime-200 disabled:cursor-not-allowed text-4xl overflow-clip"
                        disabled={emojiToPlace === null || garden[i] !== ""}
                        onClick={() => handlePlantEmoji(i)}
                        >
                        {garden[i]}
                    </button>
                ))}
            </div>

            <div className="flex flex-col justify-start items-start gap-2">
                { emojiToPlace && (
                    <>
                    <div className="bg-cyan-100 rounded text-4xl px-6 py-4">{emojiToPlace} Plant me!</div>
                    <p className="text-sm text-stone-400">Click on a square to plant your emoji. <button className="underline" onClick={() => handleEmojiToPlant()}>Re-spin</button></p>
                    </>
                )}
                { !emojiToPlace && (
                    <>
                    <button className="bg-cyan-100 rounded text-4xl px-6 py-4" onClick={() => handleEmojiToPlant()}>Plant a seed!</button>
                    </>
                )}
            </div>
        </div>
    )
}