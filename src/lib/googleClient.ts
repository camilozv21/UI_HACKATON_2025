import { GoogleAuth } from "google-auth-library";
import { Storage } from "@google-cloud/storage";
import { getSignedUrl } from "./UploadFile";

export type Languages = {
  value: string;
  label: string;
}[];

const LOCATION = process.env.LOCATION;
const MODEL_ID = "gemini-2.5-pro";
const BUCKET_NAME = process.env.BUCKET_NAME || "videos-uploaded-industry";

const rawKey = process.env.GCP_KEY;

if (!rawKey) {
  throw new Error("Falta la credencial de Google en GCP_KEY");
}

const credentials = JSON.parse(rawKey);

const auth = new GoogleAuth({
  credentials,
  projectId: credentials.project_id,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const storage = new Storage({
  projectId: credentials.project_id,
  credentials,
});

async function callVertex(prompt: string, input: string, isVideo = true) {
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  const token = await client.getAccessToken();
 const inputUrl = Array.isArray(input) ? input[0] : input;

 const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent`;

  let contentsObj: { role: string; parts: Array<{ fileData?: { fileUri: string; mimeType: string }; text?: string }> };

  if (isVideo) {
    contentsObj = {
      role: "user",
      parts: [
        {
          fileData: {
            fileUri: inputUrl,
            mimeType: "video/mp4",
          },
        },
        {
          text: prompt,
        },
      ],
    };
  } else {
    contentsObj = {
      role: "user",
      parts: [
        { text: prompt },
        { text: inputUrl },
      ],
    };
  }

  const body = { contents: contentsObj };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.token || token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(await resp.text());
  const json = await resp.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function saveToBucket(fileName: string, content: string) {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(`vtt_files/${fileName}`);
  await file.save(content, {
    contentType: "text/vtt; charset=utf-8",
    resumable: false,
    validation: "md5",
  });
}

export async function generateMultilangDescriptions(videoUrl: string, languages: Languages) {
  const results: Record<string, string> = {};

  const basePrompt = `
    You are a video accessibility assistant. 
    Generate an ADA-compliant description of the following video in English.
    ⚠️ Important formatting rules:
    - Always return the result as a valid WebVTT file.
    - Begin the output with "WEBVTT".
    - Each caption block must include:
      * A timestamp line in the format HH:MM:SS.MMM --> HH:MM:SS.MMM
      * One or more description lines after the timestamp.
    - Do not include extra introductions, explanations, or code blocks.
    - Duration can be approximate (e.g., break every 5-10 seconds).
    - Ensure output is UTF-8 safe (no encoding artifacts).
  `;
  
  const baseVtt = await callVertex(basePrompt, videoUrl);

  const baseFileName = `subtitles.en.vtt`;
  await saveToBucket(baseFileName, baseVtt);
  const baseUrl = await getSignedUrl(BUCKET_NAME, `vtt_files/${baseFileName}`);
  results["en"] = baseUrl;

  for (const lang of languages) {
    if (lang.value === "en") continue;

    const translatePrompt = `
      You are a professional translator.
      Translate the following WebVTT captions into ${lang.label}.
      ⚠️ Important rules:
      - Keep timestamps unchanged.
      - Preserve "WEBVTT" header.
      - Only translate the caption text (not the timestamps).
      - Do not add extra explanations or code blocks.
    `;

    const translation = await callVertex(translatePrompt, baseVtt, false);
    const fileName = `subtitles.${lang.value}.vtt`;
    await saveToBucket(fileName, translation);
    const publicUrl = await getSignedUrl(BUCKET_NAME, `vtt_files/${fileName}`);
    
    results[lang.value] = publicUrl;
  }

  return results;
}
