export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("file");
    const apiKey = formData.get("api_key");
    const language = formData.get("language") || "de";

    if (!audioFile || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Datei und API-Key sind erforderlich." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", audioFile, audioFile.name || "audio.mp3");
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", language);
    groqForm.append("response_format", "verbose_json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqForm,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: `Groq API Fehler (${response.status}): ${errorText}`,
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Server-Fehler: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/transcribe",
};
