"use client";

import { signOut } from "next-auth/react";

export default function Signout() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: `${window.location.href}` })}
      className="underline"
    >
      Sign out
    </button>
  );
}
