// Fragt den Status eines fal.ai-Queue-Jobs ab. Ist er fertig, wird das
// Ergebnis gleich mitgeliefert. Jeder Aufruf ist kurz -> kein Timeout.
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { api_key, model, request_id } = await req.json();

    if (!api_key || !model || !request_id) {
      return json({ error: "api_key, model und request_id sind erforderlich" }, 400);
    }

    const base = `https://queue.fal.run/${model}/requests/${request_id}`;

    // 1) Status abfragen
    const statusRes = await fetch(`${base}/status`, {
      headers: { Authorization: `Key ${api_key}` },
    });
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETED") {
      return json(
        {
          status: statusData.status, // IN_QUEUE | IN_PROGRESS
          queue_position: statusData.queue_position ?? null,
        },
        200
      );
    }

    // 2) Fertig -> Ergebnis holen
    const resultRes = await fetch(base, {
      headers: { Authorization: `Key ${api_key}` },
    });
    const resultData = await resultRes.json();

    return json({ status: "COMPLETED", result: resultData }, 200);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = {
  path: "/api/fal-status",
};
