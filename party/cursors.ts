import type * as Party from "partykit/server";

export type PartialCursor = {
  x: number;
  y: number;
  pointer: "mouse" | "touch";
};

export type Cursor = PartialCursor & {
  country: CountryType;
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

type CountryType = string | null;

type CursorState = Partial<Cursor>;

type CursorConnection = Party.Connection<CursorState>;

export default class CursorsServer implements Party.Server {
  constructor(public party: Party.Party) {}
  onConnect(
    connection: CursorConnection,
    { request }: Party.ConnectionContext
  ) {
    const country = (request.cf?.country || null) as CountryType;

    // Stash the country in the websocket attachment
    connection.setState({
      ...connection.state,
      country,
    });

    // On connect, send a "sync" message to the new connection
    // Pull the cursor from all websocket attachments, excluding self
    let cursors = <CursorsMap>{};
    for (const socket of this.party.getConnections<CursorState>()) {
      const state = socket.state || {};
      if (
        socket.id !== connection.id &&
        state.x !== undefined &&
        state.y !== undefined
      ) {
        cursors[socket.id] = {
          x: state.x,
          y: state.y,
          pointer: state.pointer!,
          country: state.country!,
          lastUpdate: Date.now(),
        };
      }
    }

    const msg = <SyncMessage>{
      type: "sync",
      cursors: cursors,
    };
    connection.send(JSON.stringify(msg));
  }
  onMessage(message: string, connection: CursorConnection) {
    const position = JSON.parse(message as string);
    const state = connection.state;
    const cursor = <Cursor>{
      x: position.x,
      y: position.y,
      pointer: position.pointer,
      country: state!.country,
      lastUpdate: Date.now(),
    };

    // Stash the cursor in the websocket attachment
    connection.setState({
      ...state,
      ...cursor,
    });

    const msg =
      position.x && position.y
        ? <UpdateMessage>{
            type: "update",
            id: connection.id,
            ...cursor,
          }
        : <RemoveMessage>{
            type: "remove",
            id: connection.id,
          };

    // Broadcast, excluding self
    this.party.broadcast(JSON.stringify(msg), [connection.id]);
  }
  onClose(connection: CursorConnection) {
    // Broadcast a "remove" message to all connections
    const msg = <RemoveMessage>{
      type: "remove",
      id: connection.id,
    };
    this.party.broadcast(JSON.stringify(msg));
  }
}
