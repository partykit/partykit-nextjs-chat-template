"use client";

import { useEffect, useState, useMemo } from "react";
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
import ConnectionStatus from "../components/ConnectionStatus";
import Display from "./Display";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

const store = syncedStore(yDocShape);
const doc = getYjsDoc(store);

export default function Garden() {
  const [starter, setStarter] = useState<Cell>(null);
  const gardenSize = gardenDimensions.width * gardenDimensions.height;
  const state = useSyncedStore(store);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // A list of Cell { lineage, index, emoji } objects
  const starterEmojis = getStarterEmojis();

  const provider = useMemo(
    () =>
      new YPartyKitProvider(host, "shared-garden", doc, {
        party: "garden",
        connect: false,
      }),
    []
  );

  useEffect(() => {
    const onStatus = () => setSocket(provider.ws);
    provider.connect();
    provider.on("status", onStatus);
    return () => {
      provider.off("status", onStatus);
      provider.disconnect();
    };
  }, []);

  useEffect(() => {
    setSocket(provider.ws);
  }, [provider]);

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
    <>
      <div className="flex flex-col gap-6 justify-start items-start">
        <Display
          garden={state.garden as Garden}
          handlePlantEmoji={handlePlantEmoji}
          gardenSize={gardenSize}
          starterIsEmpty={starter === null}
        />

        <div className="flex flex-col justify-start items-start gap-2">
          {starter && (
            <div className="flex flex-row justify-start items-end gap-4">
              <div className="bg-cyan-200 outline outline-2 outline-cyan-300 drop-shadow rounded-lg text-4xl px-6 py-4">
                {starter.emoji} Plant me!
              </div>
              <p className="text-sm text-stone-400 mb-2 text-lg">
                <button
                  className="underline"
                  onClick={() => handleGetStarter()}
                >
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
      <ConnectionStatus socket={socket} />
    </>
  );
}
