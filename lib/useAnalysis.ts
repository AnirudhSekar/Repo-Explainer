"use client";

import { useAnalysisStore } from "@/lib/store";
import { formatRepoUrl } from "@/lib/utils";

export function useAnalysis() {
  const { setStatus, setProgress, setResult, setError, reset } = useAnalysisStore();

  async function analyze(url: string, token?: string, forceRefresh?: boolean) {
    const repoInfo = formatRepoUrl(url);
    if (!repoInfo) {
      setError("Invalid GitHub URL. Please use a URL like https://github.com/owner/repo");
      return;
    }

    reset();
    setStatus("fetching");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, token, forceRefresh }),
    });

    if (!response.ok) {
      setError("Failed to start analysis. Please try again.");
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      setError("Streaming not supported in this browser.");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let currentEvent = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            handleEvent(currentEvent, data);
          } catch {
            // Malformed JSON — skip
          }
        }
      }
    }
  }

  const STEP_STATUS_MAP: Record<string, "fetching" | "analyzing" | "generating"> = {
    fetching: "fetching",
    fetching_files: "fetching",
    stack: "analyzing",
    summarizing: "analyzing",
    architecture: "generating",
    diagram: "generating",
    setup: "generating",
    junior: "generating",
  };

  function handleEvent(event: string, data: unknown) {
    if (event === "progress" && typeof data === "object" && data !== null) {
      setProgress(data as Parameters<typeof setProgress>[0]);
      const step = (data as { step: string }).step;
      const nextStatus = STEP_STATUS_MAP[step];
      if (nextStatus) setStatus(nextStatus);
    } else if (event === "result") {
      setResult(data as Parameters<typeof setResult>[0]);
    } else if (event === "error" && typeof data === "object" && data !== null) {
      setError((data as { message: string }).message);
    }
  }

  return { analyze };
}
