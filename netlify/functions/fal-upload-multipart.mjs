// Startet einen Multipart-Upload bei fal.ai (fuer grosse Dateien > 90 MB).
// Gibt upload_url + file_url zurueck. Die einzelnen Teile und der Abschluss
// laufen danach direkt vom Browser zur fal-CDN (presigned, kein Key noetig).
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { api_key, file_name, content_type } = await req.json();

    if (!api_key || !file_name) {
      return json({ error: "api_key und file_name sind erforderlich" }, 400);
    }

    const response = await fetch(
      "https://rest.fal.ai/storage/upload/initiate-multipart?storage_type=fal-cdn-v3",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name,
          content_type: content_type || "application/octet-stream",
        }),
      }
    );

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
  path: "/api/fal-upload-multipart",
};
