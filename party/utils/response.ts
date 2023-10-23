const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
};

export const json = <T>(data: T, status = 200) =>
  Response.json(data, { status, headers: CORS });

export const ok = () => json({ ok: true });

export const error = (err: string | { message: string }, status = 500) => {
  console.error("Error response", err);
  return json(
    {
      ok: false,
      error: typeof err === "string" ? err : err.message ?? "Unknown error",
    },
    status
  );
};

export const notFound = () => error("Not found", 404);

export const noContent = () => new Response(null, { status: 204 });
