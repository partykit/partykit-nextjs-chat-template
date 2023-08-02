"use client";

import { useState } from "react";
import { syncedStore, getYjsDoc } from "@syncedstore/core";
import { useSyncedStore } from "@syncedstore/react";
import YPartyKitProvider from "y-partykit/provider";
import { getStarterEmojis, Cell, Garden, yDocShape, gardenDimensions } from "@/party/garden";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

const store = syncedStore(yDocShape);
const doc = getYjsDoc(store);

export default function Garden() {
    const [starter, setStarter] = useState<Cell>(null);
    const gardenSize = gardenDimensions.width * gardenDimensions.height;
    const state = useSyncedStore(store);

    // A list of Cell { lineage, index, emoji } objects
    const starterEmojis = getStarterEmojis();

    const provider = new YPartyKitProvider(
        host,
        "shared-garden",
        doc,
        {party: "garden"});

    const handlePlantEmoji = (i: number) => {
        if (starter) {
            // plant the starter emoji in the garden
            state.garden[i] = starter;
            setStarter(null);
        }
    }

    const handleGetStarter = () => {
        // get a random starter from the starterEmojis
        const randomStarter = starterEmojis[Math.floor(Math.random() * starterEmojis.length)];
        setStarter(randomStarter);
    }

    return (
        <div className="flex flex-col gap-6 justify-start items-start">
            <div className="grid grid-cols-10 grid-rows-10">
                { [...Array(gardenSize)].map((_, i) => {
                    const cell = state.garden[i] ?? null;
                    return <button
                        key={i}
                        className="bg-lime-100 w-10 h-10 flex justify-center items-center disabled:bg-stone-100 hover:bg-lime-200 disabled:cursor-not-allowed text-4xl overflow-clip"
                        disabled={starter === null || cell !== null}
                        onClick={() => handlePlantEmoji(i)}
                        >
                        {cell ? cell.emoji : ""}
                    </button>
                })}
            </div>

            <div className="flex flex-col justify-start items-start gap-2">
                { starter && (
                    <>
                    <div className="bg-cyan-100 rounded text-4xl px-6 py-4">{starter.emoji} Plant me!</div>
                    <p className="text-sm text-stone-400">Click on a square to plant your emoji. <button className="underline" onClick={() => handleGetStarter()}>Re-spin</button></p>
                    </>
                )}
                { !starter && (
                    <>
                    <button className="bg-cyan-100 rounded text-4xl px-6 py-4" onClick={() => handleGetStarter()}>Plant a seed!</button>
                    </>
                )}
            </div>
        </div>
    )
}