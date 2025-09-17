"use client";

import { useState } from "react";
import { availableLanguages } from "@/utils/languages";
import { Languages } from "@/lib/googleClient";
import { Result } from "@/components/Tool/DownloadResult";

export function useConfigResult(fileUrl: string) {
  const [languages, setLanguages] = useState<Languages>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const handleLanguagesChange = (selectedValues: string[]) => {
    const selectedObjects = availableLanguages.filter((lang) =>
      selectedValues.includes(lang.value)
    );
    setLanguages(selectedObjects);
  };

  const generateResult = async () => {
    if (!fileUrl || languages.length === 0) {
      setError("Please provide a file and select at least one language.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: fileUrl,
          languages,
        }),
      });

      if (!response.ok) throw new Error(` ${response.statusText}`);

      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return {
    languages,
    handleLanguagesChange,
    generateResult,
    loading,
    error,
    result,
  };
}
