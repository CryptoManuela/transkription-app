// Stellt die Transkription in die fal.ai-QUEUE (statt synchron auf das
// Ergebnis zu warten). Gibt sofort eine request_id zurueck -> kein
// "504 Inactivity Timeout" mehr, auch bei langen Aufnahmen.
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { api_key, model, input } = await req.json();

    if (!api_key || !model || !input) {
      return json({ error: "api_key, model und input sind erforderlich" }, 400);
    }

    // Queue-Endpunkt: nimmt den Job an und antwortet sofort mit { request_id, ... }
    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
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
  path: "/api/fal-transcribe",
};
