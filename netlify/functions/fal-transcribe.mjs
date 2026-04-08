export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { api_key, model, input } = await req.json();

    if (!api_key || !model || !input) {
      return new Response(
        JSON.stringify({ error: "api_key, model und input sind erforderlich" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = `https://fal.run/${model}`;
    console.log("Calling fal.ai:", url, "input:", JSON.stringify(input).substring(0, 200));
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data, debug: { url, status: response.status, model } }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/fal-transcribe",
};
