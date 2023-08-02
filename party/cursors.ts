import type { PartyKitServer } from "partykit/server";

export type PartialCursor = {
  x: number;
  y: number;
  pointer: "mouse" | "touch";
};

export type Cursor = PartialCursor & {
  country: string | null;
  lastUpdate: number;
};

export type CursorsMap = {
  [id: string]: Cursor;
};

type UpdateMessage = {
  type: "update";
  id: string; // websocket.id
} & PartialCursor;

type SyncMessage = {
  type: "sync";
  cursors: { [id: string]: Cursor };
};

type RemoveMessage = {
  type: "remove";
  id: string; // websocket.id
};

// server.ts
export default {
  onConnect(websocket, room, { request }) {
    const country = request.cf?.country ?? null;

    // Stash the country in the websocket attachment
    websocket.serializeAttachment({
      ...websocket.deserializeAttachment(),
      country: country,
    });

    // On connect, send a "sync" message to the new connection
    // Pull the cursor from all websocket attachments, excluding self
    let cursors = <CursorsMap>{};
    Array.from(room.connections).forEach(([id, ws]) => {
      let cursor = ws.deserializeAttachment();
      if (
        id !== websocket.id &&
        cursor !== null &&
        cursor.x !== undefined &&
        cursor.y !== undefined
      ) {
        cursors[id] = cursor;
      }
    });
    const msg = <SyncMessage>{
      type: "sync",
      cursors: cursors,
    };
    websocket.send(JSON.stringify(msg));
  },
  onMessage(message, websocket, room) {
    const position = JSON.parse(message as string);
    const attachment = websocket.deserializeAttachment();
    const cursor = <Cursor>{
      x: position.x,
      y: position.y,
      pointer: position.pointer,
      country: attachment.country,
      lastUpdate: Date.now(),
    };

    // Stash the cursor in the websocket attachment
    websocket.serializeAttachment({
      ...attachment,
      ...cursor,
    });

    const msg =
      position.x && position.y
        ? <UpdateMessage>{
            type: "update",
            id: websocket.id,
            ...cursor,
          }
        : <RemoveMessage>{
            type: "remove",
            id: websocket.id,
          };

    // Broadcast, excluding self
    room.broadcast(JSON.stringify(msg), [websocket.id]);
  },
  onClose(websocket, room) {
    // Broadcast a "remove" message to all connections
    const msg = <RemoveMessage>{
      type: "remove",
      id: websocket.id,
    };
    room.broadcast(JSON.stringify(msg), []);
  },
} satisfies PartyKitServer;
