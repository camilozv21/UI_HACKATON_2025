"use client";

import { Button, Paper, Text, Center } from "@mantine/core";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export type Result = {
  files: {
    [lang: string]: string; // idioma -> url firmada en GCS
  };
};

export default function DownloadResult({ result }: { result: Result }) {
  const handleDownloadZip = async () => {
    const zip = new JSZip();

    for (const [lang, rawUrl] of Object.entries(result.files)) {
      try {
        // Limpiar URL (si viene con gs://, la reducimos a https://)
        const cleanUrl = rawUrl.includes("https://")
          ? rawUrl.substring(rawUrl.indexOf("https://"))
          : rawUrl;

        // Llamar al endpoint proxy de Next.js
        const response = await fetch(
          `/api/download-vtt?url=${encodeURIComponent(cleanUrl)}`
        );
        if (!response.ok) throw new Error(`Error descargando ${lang}`);

        const blob = await response.blob();

        // Guardar en el ZIP con nombre basado en el idioma
        zip.file(`captions_${lang}.vtt`, blob);
      } catch (err) {
        console.error(`Error descargando ${lang}:`, err);
      }
    }

    // Generar y descargar el zip
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "subtitles.zip");
  };

  return (
    <Center style={{ minHeight: "70vh" }}>
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Text fw={600} size="lg" mb="md" ta="center">
          Subtitles ready! 🎉
        </Text>
        <Button
          size="lg"
          color="var(--primary-color)"
          fullWidth
          onClick={handleDownloadZip}
        >
          Download VTT files
        </Button>
      </Paper>
    </Center>
  );
}
