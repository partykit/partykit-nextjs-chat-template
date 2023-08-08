PartyKit is an open source platform for developing multiplayer, real-time applications.

This is a [PartyKit](https://partykit.io) project using [Next.js](https://nextjs.org/) bootstrapped with [`partykit-nextjs-chat-template`](https://github.com/partykit/partykit-nextjs-chat-template).

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

This will start the PartyKit development server at port **1999**, and a Next.js development server at port **3000**.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
## What's included

This template application demonstrates various use cases of PartyKit.

- The [`/party`](party/) directory contains partykit servers with the following examples:
    - ℹ️ [main.ts](party/main.ts) — Simplest possible HTTP and WebSocket server.
    - 💬 [chatRoom.ts](party/chatRoom.ts) — Real-time chat room with persistence 
    - 👩‍👩‍👦‍👦 [chatRooms.ts](party/chatRooms.ts) — Presence and room-to-room communication 
    - 🙋‍♀️ [user.ts](party/user.ts) — User session management and authentication with [NextAuth.js](https://next-auth.js.org/) 
    - 🤖 [ai.ts](party/ai.ts) — AI NPC chatroom participant using LLMs 
    - 🏡 [garden.ts](party/garden.ts) — Shared documents using [Y.js](https://yjs.dev) 
    - 🐭 [cursors.ts](party/cursors.ts) — Shared cursors
- The [`/app`](app/) directory contains a Next.js 13 application, demonstrating client-side usage of PartyKit, including:
    - 📡 [chat/page.tsx](app/chat/page.tsx) — Server Rendering in React Server Components
    - 📱 [RoomList.tsx](app/chat/RoomList.tsx) — Client Rendering with live WebSockets
    - 👮‍♀️ [Room.tsx](app/chat/[roomId]/Room.tsx) — A real-time chatroom with authentication
    - 👨‍👩‍👧‍👦 [Garden.tsx](app/garden/Garden.tsx) — Listen and update a shared [Y.js](https://yjs.dev) document via [SyncedStore](https://syncedstore.org/docs/react)
    - 🖱️ [Cursors.tsx](app/(home)/Cursors.tsx) — Live cursors
    - 🚥 [ConnectionStatus.tsx](app/components/ConnectionStatus.tsx) — Connection status indicator


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
