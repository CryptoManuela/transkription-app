// --- State ---
let selectedFile = null;

// --- Helper: warten ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- DOM ---
const providerSelect = document.getElementById("provider");
const groqKeySection = document.getElementById("groq-key-section");
const falKeySection = document.getElementById("fal-key-section");
const groqKeyInput = document.getElementById("groq-api-key");
const falKeyInput = document.getElementById("fal-api-key");
const saveGroqKeyBtn = document.getElementById("save-groq-key");
const saveFalKeyBtn = document.getElementById("save-fal-key");
const groqKeyStatus = document.getElementById("groq-key-status");
const falKeyStatus = document.getElementById("fal-key-status");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");
const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const removeFileBtn = document.getElementById("remove-file");
const languageSelect = document.getElementById("language");
const modelSelect = document.getElementById("model");
const timestampsCheckbox = document.getElementById("timestamps");
const diarizeCheckbox = document.getElementById("diarize");
const diarizeRow = document.getElementById("diarize-row");
const diarizeHint = document.getElementById("diarize-hint");
const startBtn = document.getElementById("start-btn");
const progressSection = document.getElementById("progress-section");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const resultSection = document.getElementById("result-section");
const transcript = document.getElementById("transcript");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");

// --- Key UI Elements ---
const falKeySaved = document.getElementById("fal-key-saved");
const falKeyInputSection = document.getElementById("fal-key-input");
const falKeyChangeBtn = document.getElementById("fal-key-change");
const falKeyDeleteBtn = document.getElementById("fal-key-delete");
const groqKeySaved = document.getElementById("groq-key-saved");
const groqKeyInputSection = document.getElementById("groq-key-input");
const groqKeyChangeBtn = document.getElementById("groq-key-change");
const groqKeyDeleteBtn = document.getElementById("groq-key-delete");

// --- Init: Keys laden ---
updateProviderUI();
updateModelOptions();
applyDiarizeConstraint();
updateKeyUI("fal");
updateKeyUI("groq");
updateStartButton();

// --- Provider Switch ---
providerSelect.addEventListener("change", () => {
  updateProviderUI();
  updateModelOptions();
  applyDiarizeConstraint();
  updateStartButton();
});

function updateProviderUI() {
  const provider = providerSelect.value;
  groqKeySection.classList.toggle("hidden", provider !== "groq");
  falKeySection.classList.toggle("hidden", provider !== "fal");
  // Speaker-Trennung nur bei fal.ai anzeigen
  const showDiarize = provider === "fal";
  if (diarizeRow) diarizeRow.classList.toggle("hidden", !showDiarize);
  if (diarizeHint) diarizeHint.classList.toggle("hidden", !showDiarize);
}

function updateModelOptions() {
  const provider = providerSelect.value;
  if (provider === "fal") {
    modelSelect.innerHTML = `
      <option value="fal-ai/wizper" selected>Wizper — blitzschnell (fal.ai)</option>
      <option value="fal-ai/whisper">Whisper Large v3 (fal.ai)</option>
    `;
  } else {
    modelSelect.innerHTML = `
      <option value="whisper-large-v3" selected>Whisper Large v3 (beste Qualität)</option>
      <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo (schneller)</option>
    `;
  }
}

// Speaker-Trennung gibt es bei fal.ai nur mit dem Whisper-Modell (nicht Wizper).
// Wenn die Checkbox an ist, erzwingen wir Whisper und sperren Wizper.
function applyDiarizeConstraint() {
  if (providerSelect.value !== "fal" || !diarizeCheckbox) return;
  const wizperOpt = modelSelect.querySelector('option[value="fal-ai/wizper"]');
  if (diarizeCheckbox.checked) {
    modelSelect.value = "fal-ai/whisper";
    if (wizperOpt) wizperOpt.disabled = true;
  } else if (wizperOpt) {
    wizperOpt.disabled = false;
  }
}

if (diarizeCheckbox) {
  diarizeCheckbox.addEventListener("change", applyDiarizeConstraint);
}

// --- Key UI ---
function updateKeyUI(provider) {
  const hasKey = !!localStorage.getItem(provider === "fal" ? "fal_api_key" : "groq_api_key");
  const savedEl = provider === "fal" ? falKeySaved : groqKeySaved;
  const inputEl = provider === "fal" ? falKeyInputSection : groqKeyInputSection;

  if (hasKey) {
    savedEl.classList.remove("hidden");
    inputEl.classList.add("hidden");
  } else {
    savedEl.classList.add("hidden");
    inputEl.classList.remove("hidden");
  }
}

// --- API Keys speichern ---
saveGroqKeyBtn.addEventListener("click", () => {
  const key = groqKeyInput.value.trim();
  if (!key.startsWith("gsk_")) {
    groqKeyStatus.textContent = "Ungültiger Key — muss mit gsk_ beginnen";
    groqKeyStatus.className = "status-text error";
    return;
  }
  localStorage.setItem("groq_api_key", key);
  groqKeyInput.value = "";
  updateKeyUI("groq");
  updateStartButton();
});

saveFalKeyBtn.addEventListener("click", () => {
  const key = falKeyInput.value.trim();
  if (!key) {
    falKeyStatus.textContent = "Bitte Key eingeben";
    falKeyStatus.className = "status-text error";
    return;
  }
  if (!key.includes(":")) {
    falKeyStatus.textContent = "Key unvollständig — muss KEY_ID:KEY_SECRET enthalten (mit Doppelpunkt)";
    falKeyStatus.className = "status-text error";
    return;
  }
  localStorage.setItem("fal_api_key", key);
  falKeyInput.value = "";
  falKeyStatus.textContent = "";
  updateKeyUI("fal");
  updateStartButton();
});

// --- Key ändern / löschen ---
falKeyChangeBtn.addEventListener("click", () => {
  falKeySaved.classList.add("hidden");
  falKeyInputSection.classList.remove("hidden");
  falKeyInput.value = localStorage.getItem("fal_api_key") || "";
});

falKeyDeleteBtn.addEventListener("click", () => {
  localStorage.removeItem("fal_api_key");
  falKeyInput.value = "";
  updateKeyUI("fal");
  updateStartButton();
});

groqKeyChangeBtn.addEventListener("click", () => {
  groqKeySaved.classList.add("hidden");
  groqKeyInputSection.classList.remove("hidden");
  groqKeyInput.value = localStorage.getItem("groq_api_key") || "";
});

groqKeyDeleteBtn.addEventListener("click", () => {
  localStorage.removeItem("groq_api_key");
  groqKeyInput.value = "";
  updateKeyUI("groq");
  updateStartButton();
});

// --- Drag & Drop ---
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    handleFile(fileInput.files[0]);
  }
});

removeFileBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInfo.classList.add("hidden");
  fileInput.value = "";
  updateStartButton();
});

function handleFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const validExts = ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "mov"];

  if (!validExts.includes(ext)) {
    alert("Dieses Dateiformat wird nicht unterstützt.\nErlaubt: MP3, MP4, M4A, WAV, OGG, WEBM");
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatSize(file.size);
  fileInfo.classList.remove("hidden");
  updateStartButton();
}

// --- Start ---
startBtn.addEventListener("click", startTranscription);

async function startTranscription() {
  if (!selectedFile) return;

  const provider = providerSelect.value;
  const apiKey = provider === "groq"
    ? localStorage.getItem("groq_api_key")
    : localStorage.getItem("fal_api_key");

  if (!apiKey) return;

  startBtn.disabled = true;
  progressSection.classList.remove("hidden");
  resultSection.classList.add("hidden");

  try {
    if (provider === "fal") {
      await transcribeWithFal(apiKey);
    } else {
      await transcribeWithGroq(apiKey);
    }
  } catch (err) {
    const msg = err?.message || err?.detail || JSON.stringify(err) || "Unbekannter Fehler";
    updateProgress(0, `Fehler: ${msg}`);
    progressText.style.color = "#ef4444";
  } finally {
    startBtn.disabled = false;
  }
}

// ==========================================
// FAL.AI UPLOAD  (klein = ein Stück, gross = Multipart)
// ==========================================

const FAL_MULTIPART_THRESHOLD = 90 * 1024 * 1024; // 90 MB (wie fal-SDK)

async function uploadFileToFal(apiKey, file) {
  const contentType = file.type || "application/octet-stream";

  // Grosse Dateien: Multipart-Upload (sonst 413 "Payload Too Large")
  if (file.size > FAL_MULTIPART_THRESHOLD) {
    return await falMultipartUpload(apiKey, file, contentType);
  }

  // Kleine Dateien: ein einziger Upload (wie bisher)
  updateProgress(10, "Upload wird vorbereitet...");
  const initResponse = await fetch("/api/fal-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      file_name: file.name,
      content_type: contentType,
    }),
  });

  if (!initResponse.ok) {
    throw new Error(`Upload-Init fehlgeschlagen: ${await initResponse.text()}`);
  }

  const { upload_url, file_url } = await initResponse.json();

  updateProgress(30, "Datei wird hochgeladen...");
  let uploadResponse;
  try {
    uploadResponse = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
  } catch (uploadErr) {
    throw new Error(`Datei-Upload Netzwerkfehler: ${uploadErr.message}`);
  }

  if (!uploadResponse.ok) {
    throw new Error(`Datei-Upload fehlgeschlagen (${uploadResponse.status})`);
  }

  return file_url;
}

// Multipart-Upload nach fal-CDN-v3-Contract:
// initiate-multipart (ueber Netlify-Function, mit Key) -> Teile direkt zur CDN
// (presigned, kein Key) -> complete.
async function falMultipartUpload(apiKey, file, contentType) {
  updateProgress(5, "Grosse Datei — Upload wird vorbereitet...");

  const initRes = await fetch("/api/fal-upload-multipart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      file_name: file.name,
      content_type: contentType,
    }),
  });

  if (!initRes.ok) {
    throw new Error(`Multipart-Init fehlgeschlagen (${initRes.status}): ${await initRes.text()}`);
  }

  const { upload_url, file_url } = await initRes.json();
  if (!upload_url || !file_url) {
    throw new Error("Multipart-Init: keine Upload-URL erhalten");
  }

  const parsed = new URL(upload_url);
  const chunkSize = 10 * 1024 * 1024; // 10 MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  const parts = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const partNumber = i + 1;
    const partUrl = `${parsed.origin}${parsed.pathname}/${partNumber}${parsed.search}`;

    let part = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await fetch(partUrl, { method: "PUT", body: chunk });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        let parsedPart = {};
        try { parsedPart = JSON.parse(txt); } catch { parsedPart = {}; }
        const etag = parsedPart.etag || r.headers.get("ETag") || r.headers.get("etag");
        part = { partNumber: parsedPart.partNumber || partNumber, etag };
        break;
      } catch (e) {
        if (attempt === 3) {
          throw new Error(`Teil ${partNumber}/${totalChunks} fehlgeschlagen: ${e.message}`);
        }
        await sleep(1000 * attempt);
      }
    }

    parts.push(part);
    // Upload-Fortschritt zwischen 5% und 40% verteilen
    const pct = 5 + Math.round((partNumber / totalChunks) * 35);
    updateProgress(pct, `Datei wird hochgeladen... (${partNumber}/${totalChunks} Teile)`);
  }

  // Upload abschliessen
  updateProgress(42, "Upload wird abgeschlossen...");
  const completeUrl = `${parsed.origin}${parsed.pathname}/complete${parsed.search}`;
  const completeRes = await fetch(completeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parts }),
  });

  if (!completeRes.ok) {
    throw new Error(`Upload-Abschluss fehlgeschlagen (${completeRes.status}): ${await completeRes.text()}`);
  }

  return file_url;
}

// ==========================================
// FAL.AI TRANSCRIPTION  (Queue-API: einreichen -> pollen -> Ergebnis holen)
// ==========================================

async function transcribeWithFal(apiKey) {
  const falModel = modelSelect.value;
  const language = languageSelect.value;
  const useDiarize = !!(diarizeCheckbox && diarizeCheckbox.checked) && providerSelect.value === "fal";

  // Schritt 1+2: Datei zu fal hochladen (klein = ein Stück, gross = Multipart)
  const file_url = await uploadFileToFal(apiKey, selectedFile);

  // Schritt 3: Transkription in die Queue stellen
  updateProgress(50, "Transkription wird gestartet...");

  let input;
  if (falModel === "fal-ai/wizper") {
    input = {
      audio_url: file_url,
      task: "transcribe",
      chunk_level: "segment",
      version: "3",
    };
  } else {
    // fal-ai/whisper — unterstuetzt Speaker-Trennung (diarize)
    input = {
      audio_url: file_url,
      task: "transcribe",
      chunk_level: "segment",
    };
    if (useDiarize) input.diarize = true;
  }

  if (language !== "auto") {
    input.language = language;
  }

  let submitResponse;
  try {
    submitResponse = await fetch("/api/fal-transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        model: falModel,
        input,
      }),
    });
  } catch (fetchErr) {
    throw new Error(`Transkription Netzwerkfehler: ${fetchErr.message}`);
  }

  const submitText = await submitResponse.text();

  if (!submitResponse.ok) {
    throw new Error(`fal.ai Fehler (${submitResponse.status}): ${parseFalError(submitText)}`);
  }

  let submitData;
  try {
    submitData = JSON.parse(submitText);
  } catch {
    throw new Error("Ungültige Antwort von fal.ai (Submit)");
  }

  const requestId = submitData.request_id;
  if (!requestId) {
    throw new Error("Keine request_id von fal.ai erhalten");
  }

  // Schritt 4: Pollen, bis fertig (jeder Aufruf ist kurz -> kein Timeout)
  updateProgress(60, "Transkription läuft... (bei langen Aufnahmen etwas Geduld)");

  let data = null;
  const intervalMs = 4000;
  const maxTries = 225; // 225 * 4s = 15 Minuten Sicherheitsreserve

  for (let i = 0; i < maxTries; i++) {
    await sleep(intervalMs);

    let statusResponse;
    try {
      statusResponse = await fetch("/api/fal-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          model: falModel,
          request_id: requestId,
        }),
      });
    } catch (pollErr) {
      continue; // kurzer Netzwerk-Hänger -> nächster Versuch
    }

    const statusText = await statusResponse.text();

    if (!statusResponse.ok) {
      throw new Error(`Status-Abfrage fehlgeschlagen (${statusResponse.status}): ${parseFalError(statusText)}`);
    }

    let statusData;
    try {
      statusData = JSON.parse(statusText);
    } catch {
      throw new Error("Ungültige Antwort von fal.ai (Status)");
    }

    if (statusData.status === "COMPLETED") {
      data = statusData.result;
      break;
    } else if (statusData.status === "IN_PROGRESS") {
      updateProgress(80, "Transkription läuft...");
    } else {
      const pos = statusData.queue_position != null ? ` (Position ${statusData.queue_position})` : "";
      updateProgress(65, `In der Warteschlange${pos}...`);
    }
  }

  if (!data) {
    throw new Error("Zeitüberschreitung — die Transkription hat zu lange gedauert. Bitte erneut versuchen.");
  }

  // --- Ergebnis formatieren ---
  const hasSpeakers =
    (data.diarization_segments && data.diarization_segments.length > 0) ||
    (data.chunks && data.chunks.some((c) => c && c.speaker != null));

  if (useDiarize && hasSpeakers) {
    showResult(formatDiarized(data, timestampsCheckbox.checked));
  } else if (timestampsCheckbox.checked && data.chunks && data.chunks.length > 0) {
    const text = data.chunks
      .map((chunk) => {
        const start = chunk.timestamp?.[0] ?? 0;
        return `[${formatTimestamp(start)}] ${chunk.text.trim()}`;
      })
      .join("\n");
    showResult(text);
  } else {
    showResult(data.text || "");
  }
}

function parseFalError(responseText) {
  try {
    const errData = JSON.parse(responseText);
    return errData.detail?.[0]?.msg || errData.detail || errData.error || responseText;
  } catch {
    return responseText;
  }
}

// ==========================================
// SPEAKER-TRENNUNG: Chunks + Diarisierung zu "Sprecher 1: ..." zusammenfuehren
// ==========================================

function segStart(seg) {
  return seg.timestamp?.[0] ?? seg.start ?? 0;
}
function segEnd(seg) {
  return seg.timestamp?.[1] ?? seg.end ?? Infinity;
}

function speakerForTime(t, segments) {
  for (const s of segments) {
    if (t >= segStart(s) && t < segEnd(s)) return s.speaker;
  }
  // Fallback: nächstgelegenes Segment
  let best = null;
  let bestDist = Infinity;
  for (const s of segments) {
    const dist = Math.abs(segStart(s) - t);
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  return best ? best.speaker : null;
}

function formatDiarized(data, withTimestamps) {
  const chunks = data.chunks || [];
  const segments = data.diarization_segments || [];

  if (!chunks.length) return data.text || "";

  const speakerMap = {};
  let counter = 0;
  const labelFor = (raw) => {
    const key = raw == null ? "?" : String(raw);
    if (!(key in speakerMap)) {
      counter += 1;
      speakerMap[key] = `Sprecher ${counter}`;
    }
    return speakerMap[key];
  };

  const lines = [];
  let curSpeaker = null;
  let buffer = [];
  let bufferStart = 0;

  const flush = () => {
    if (!buffer.length) return;
    const prefix = withTimestamps ? `[${formatTimestamp(bufferStart)}] ` : "";
    lines.push(`${prefix}${curSpeaker}: ${buffer.join(" ").replace(/\s+/g, " ").trim()}`);
    buffer = [];
  };

  for (const chunk of chunks) {
    const start = chunk.timestamp?.[0] ?? 0;
    const raw = chunk.speaker != null ? chunk.speaker : speakerForTime(start, segments);
    const label = labelFor(raw);
    if (label !== curSpeaker) {
      flush();
      curSpeaker = label;
      bufferStart = start;
    }
    buffer.push((chunk.text || "").trim());
  }
  flush();

  return lines.join("\n\n");
}

// ==========================================
// GROQ TRANSCRIPTION  (unverändert)
// ==========================================

async function transcribeWithGroq(apiKey) {
  const MAX_CHUNK_SIZE = 24 * 1024 * 1024;

  if (selectedFile.size <= MAX_CHUNK_SIZE) {
    updateProgress(10, "Transkription läuft...");
    const result = await groqTranscribeChunk(apiKey, selectedFile, 0, 1);
    showResult(result);
  } else {
    updateProgress(0, "Große Datei — wird in Teile aufgeteilt...");
    const chunks = splitFile(selectedFile, MAX_CHUNK_SIZE);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      updateProgress(
        (i / chunks.length) * 100,
        `Teil ${i + 1} von ${chunks.length} wird transkribiert...`
      );
      const result = await groqTranscribeChunk(apiKey, chunks[i], i, chunks.length);
      results.push(result);
    }

    showResult(results.join("\n\n"));
  }
}

function splitFile(file, maxSize) {
  const chunks = [];
  let offset = 0;
  const ext = file.name.split(".").pop().toLowerCase();

  while (offset < file.size) {
    const end = Math.min(offset + maxSize, file.size);
    const blob = file.slice(offset, end);
    chunks.push(new File([blob], `chunk_${chunks.length}.${ext}`, { type: file.type }));
    offset = end;
  }

  return chunks;
}

async function groqTranscribeChunk(apiKey, file, index, total) {
  const language = languageSelect.value;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", modelSelect.value);
  if (language !== "auto") {
    formData.append("language", language);
  }
  formData.append("response_format", "verbose_json");

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    let errorMsg;
    try {
      const errData = JSON.parse(responseText);
      errorMsg = errData.error?.message || responseText;
    } catch {
      errorMsg = responseText;
    }
    throw new Error(`Groq API Fehler (${response.status}): ${errorMsg}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error("Ungültige Antwort von Groq API");
  }

  updateProgress(
    ((index + 1) / total) * 100,
    index + 1 === total ? "Fertig!" : `Teil ${index + 1} von ${total} fertig`
  );

  if (timestampsCheckbox.checked && data.segments && data.segments.length > 0) {
    return data.segments
      .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text.trim()}`)
      .join("\n");
  }

  return data.text || "";
}

// ==========================================
// RESULT & HELPERS
// ==========================================

function showResult(text) {
  transcript.value = text;
  resultSection.classList.remove("hidden");
  updateProgress(100, "Transkription abgeschlossen!");
  progressText.style.color = "#22c55e";
}

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(transcript.value);
  copyBtn.textContent = "Kopiert!";
  setTimeout(() => (copyBtn.textContent = "Kopieren"), 2000);
});

downloadBtn.addEventListener("click", () => {
  const baseName = selectedFile
    ? selectedFile.name.replace(/\.[^.]+$/, "")
    : "transkript";
  const blob = new Blob([transcript.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}_transkript.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

function updateStartButton() {
  const provider = providerSelect.value;
  const hasKey = provider === "groq"
    ? !!localStorage.getItem("groq_api_key")
    : !!localStorage.getItem("fal_api_key");
  startBtn.disabled = !selectedFile || !hasKey;
}

function updateProgress(percent, text) {
  progressBar.style.width = `${percent}%`;
  progressText.textContent = text;
  progressText.style.color = "";
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
