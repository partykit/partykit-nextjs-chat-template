import { PartyKitRoom } from "partykit/server";

/** A minimalist demo that connects to a room and displays messages */
export const webSocketConnectorDemo = (room: PartyKitRoom) =>
  html(/* html */ `
  <script>var module = window;</script>
  <script src="https://unpkg.com/partysocket@beta"></script>

  <p>This is room <b>${room.id}</b>.</p>
  <button id="connect">Connect</button>
  <pre id="output"></pre>

  <script>
    const socket = new PartySocket({ 
      host: window.location.host, 
      room: "${room.id}", 
      startClosed: true 
    });
    socket.addEventListener("message", (event) => {
      document.getElementById("output").prepend(event.data);
    });
    document.getElementById("connect").addEventListener("click", () => {
      socket.reconnect()
    });
  </script>
`);

const response = (content: string) =>
  new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });

export const html = (body: string) =>
  response(/* html */ `
<html>
<body>
  ${body}
</body>
<style>
  body {
    font-family: system-ui, sans-serif;
    margin: 3rem auto;
    padding: 0 2rem;
    max-width: 960px;
    height: 100vh;
  }
  h1,h2,h3,h4,h5,h6 { margin-top: 2.5rem; }
</style>
</html>
`);

export const index = ({ mode, url }: { mode: string; url: URL }) =>
  html(/* html */ `
    <h1>PartyKit 🎈</h1>
    <p>This is <a href="http://partykit.io">PartyKit</a> running in <b>${mode}</b> mode.</p>
`);

export const docs = (request: Request) => {
  const url = new URL(request.url);
  const mode =
    url.hostname === "localhost" || url.hostname === "127.0.0.1"
      ? "development"
      : "production";
  return index({ mode, url });
};
