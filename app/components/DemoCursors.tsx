"use client";

import { useEffect, useState } from "react";
import type { Cursor } from "@/party/cursors";
import { OtherCursorImpl } from "@/app/(home)/OtherCursor";

function makeRandomCursors() {
  const howMany = 7;
  const commonCountries = ["US", "GB"];
  const countries = ["CA", "MX", "FR", "DE", "ES", "IT", "JP", "AU", "IN"];

  const cursors: Cursor[] = [];
  for (let i = 0; i < howMany; i++) {
    const country = Math.random() > 0.5 ? commonCountries[i % 2] : countries[i];
    const pointer = Math.random() > 0.1 ? "mouse" : "touch";
    const cursor: Cursor = {
      id: `demo-${i}`,
      x: Math.random(),
      y: Math.random(),
      pointer,
      country,
      lastUpdate: 0,
    } as Cursor;
    cursors.push(cursor);
  }

  return cursors;
}

export default function DemoCursors() {
  // Sets up a listener for the key "d" to toggle the 'showDemo' state
  // The listener works only when nothing else is in focus
  // (i.e. when the user is not typing in an input field)
  // when showDemo === true, a transculent overlay is placed over the page
  // and random cursors are shown with in

  const [showDemo, setShowDemo] = useState(false);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [cursors, setCursors] = useState<Cursor[]>([]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "d") {
      setShowDemo((showDemo) => !showDemo);
    }
  };

  useEffect(() => {
    if (showDemo) {
      setCursors(makeRandomCursors());
    }
  }, [showDemo]);

  // Add an event listener to the document
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Track window dimensions
  useEffect(() => {
    const onResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div>
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
        style={{ minHeight: "100dvh" }}
      >
        {showDemo && (
          <div>
            <div className="absolute top-0 left-0 w-full h-full z-30">
              {cursors.map((cursor, i) => (
                <OtherCursorImpl
                  key={`cursor-${i}`}
                  cursor={cursor}
                  windowDimensions={dimensions}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
