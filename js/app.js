// --- State ---
let selectedFile = null;
let apiKey = localStorage.getItem("groq_api_key") || "";

// --- DOM ---
const apiKeyInput = document.getElementById("api-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const keyStatus = document.getElementById("key-status");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");
const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const removeFileBtn = document.getElementById("remove-file");
const languageSelect = document.getElementById("language");
const startBtn = document.getElementById("start-btn");
const progressSection = document.getElementById("progress-section");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const resultSection = document.getElementById("result-section");
const transcript = document.getElementById("transcript");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");

// --- Init ---
if (apiKey) {
  apiKeyInput.value = apiKey;
  keyStatus.textContent = "Key gespeichert";
  keyStatus.className = "status-text success";
}
updateStartButton();

// --- API Key ---
saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith("gsk_")) {
    keyStatus.textContent = "Ungültiger Key — muss mit gsk_ beginnen";
    keyStatus.className = "status-text error";
    return;
  }
  apiKey = key;
  localStorage.setItem("groq_api_key", key);
  keyStatus.textContent = "Key gespeichert";
  keyStatus.className = "status-text success";
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
  const validTypes = [
    "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm",
    "video/mp4", "video/webm", "video/quicktime",
  ];
  const ext = file.name.split(".").pop().toLowerCase();
  const validExts = ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "mov"];

  if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
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
  if (!selectedFile || !apiKey) return;

  startBtn.disabled = true;
  progressSection.classList.remove("hidden");
  resultSection.classList.add("hidden");

  try {
    const MAX_CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB

    if (selectedFile.size <= MAX_CHUNK_SIZE) {
      // Kleine Datei — direkt senden
      updateProgress(0, "Transkription läuft...");
      const result = await transcribeChunk(selectedFile, 0, 1);
      showResult(result);
    } else {
      // Große Datei — in Stücke teilen
      updateProgress(0, "Datei wird aufgeteilt...");
      const chunks = splitFile(selectedFile, MAX_CHUNK_SIZE);
      const results = [];

      for (let i = 0; i < chunks.length; i++) {
        updateProgress(
          ((i) / chunks.length) * 100,
          `Teil ${i + 1} von ${chunks.length} wird transkribiert...`
        );
        const result = await transcribeChunk(chunks[i], i, chunks.length);
        results.push(result);
      }

      showResult(results.join("\n\n"));
    }
  } catch (err) {
    updateProgress(0, `Fehler: ${err.message}`);
    progressText.style.color = "#ef4444";
  } finally {
    startBtn.disabled = false;
  }
}

function splitFile(file, maxSize) {
  const chunks = [];
  let offset = 0;
  const ext = file.name.split(".").pop().toLowerCase();

  while (offset < file.size) {
    const end = Math.min(offset + maxSize, file.size);
    const blob = file.slice(offset, end);
    const chunkFile = new File([blob], `chunk_${chunks.length}.${ext}`, {
      type: file.type,
    });
    chunks.push(chunkFile);
    offset = end;
  }

  return chunks;
}

async function transcribeChunk(file, index, total) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("language", languageSelect.value === "auto" ? "" : languageSelect.value);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Fehler bei Teil ${index + 1}`);
  }

  updateProgress(((index + 1) / total) * 100,
    index + 1 === total ? "Fertig!" : `Teil ${index + 1} von ${total} fertig`
  );

  return data.text || "";
}

// --- Result ---
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

// --- Helpers ---
function updateStartButton() {
  startBtn.disabled = !selectedFile || !apiKey;
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
