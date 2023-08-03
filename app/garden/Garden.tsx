"use client";

import { use, useEffect, useState } from "react";
import { syncedStore, getYjsDoc } from "@syncedstore/core";
import { useSyncedStore } from "@syncedstore/react";
import YPartyKitProvider from "y-partykit/provider";
import {
  getStarterEmojis,
  Cell,
  Garden,
  yDocShape,
  gardenDimensions,
} from "@/party/garden";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

const store = syncedStore(yDocShape);
const doc = getYjsDoc(store);

export default function Garden() {
  const [starter, setStarter] = useState<Cell>(null);
  const gardenSize = gardenDimensions.width * gardenDimensions.height;
  const state = useSyncedStore(store);

  // A list of Cell { lineage, index, emoji } objects
  const starterEmojis = getStarterEmojis();

  const provider = new YPartyKitProvider(host, "shared-garden", doc, {
    party: "garden",
    connect: false,
  });

  useEffect(() => {
    provider.connect();
  }, []);

  const handlePlantEmoji = (i: number) => {
    if (starter) {
      // plant the starter emoji in the garden
      state.garden[i] = starter;
      setStarter(null);
    }
  };

  const handleGetStarter = () => {
    // get a random starter from the starterEmojis
    const randomStarter =
      starterEmojis[Math.floor(Math.random() * starterEmojis.length)];
    setStarter(randomStarter);
  };

  return (
    <div className="flex flex-col gap-6 justify-start items-start">
      <div className="grid grid-cols-10 grid-rows-10 bg-lime-200">
        {[...Array(gardenSize)].map((_, i) => {
          const cell = state.garden[i] ?? null;
          return (
            <button
              key={i}
              className="bg-lime-200 w-10 h-10 flex justify-center items-center hover:bg-lime-300 hover:rounded-full disabled:rounded-none disabled:bg-lime-200 disabled:cursor-not-allowed text-4xl overflow-clip"
              disabled={starter === null || cell !== null}
              onClick={() => handlePlantEmoji(i)}
            >
              {cell ? cell.emoji : ""}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col justify-start items-start gap-2">
        {starter && (
          <div className="flex flex-row justify-start items-end gap-4">
            <div className="bg-cyan-200 outline outline-2 outline-cyan-300 drop-shadow rounded-lg text-4xl px-6 py-4">
              {starter.emoji} Plant me!
            </div>
            <p className="text-sm text-stone-400 mb-2 text-lg">
              <button className="underline" onClick={() => handleGetStarter()}>
                Re-spin!
              </button>
            </p>
          </div>
        )}
        {!starter && (
          <>
            <button
              className="bg-cyan-100 outline outline-2 outline-cyan-300 hover:bg-cyan-200 rounded-lg text-4xl px-6 py-4 drop-shadow-lg hover:drop-shadow"
              onClick={() => handleGetStarter()}
            >
              Get a seed!
            </button>
          </>
        )}
      </div>
    </div>
  );
}
