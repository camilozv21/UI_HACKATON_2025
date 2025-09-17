"use client";

import Footer from "@/components/Footer/Footer";
import ConfigResult from "@/components/Tool/ConfigResult";
import DownloadResult, { Result } from "@/components/Tool/DownloadResult";
import UploadFile from "@/components/Tool/UploadFile";
import { useState } from "react";

export default function Home() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  return (
    <>
      {/* Paso 1: subir archivo */}
      {!fileUrl ? (
        <>
          <UploadFile onUpload={(url) => setFileUrl(url)} />
          <Footer />
        </>
      ) : (
        <>
          {/* Paso 2: configurar y generar subtítulos */}
          {!result ? (
            <ConfigResult
              fileUrl={fileUrl}
              onResult={(res) => setResult(res)}
            />
          ) : (
            /* Paso 3: mostrar componente de descarga */
            <DownloadResult result={result} />
          )}
        </>
      )}
    </>
  );
}
