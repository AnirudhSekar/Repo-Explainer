"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current || !chart) return;
      setError(null);

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#1c1917",
            primaryTextColor: "#e7e5e4",
            primaryBorderColor: "#f59e0b",
            lineColor: "#78716c",
            secondaryColor: "#292524",
            tertiaryColor: "#1c1917",
            background: "#0c0a09",
            mainBkg: "#1c1917",
            nodeBorder: "#f59e0b",
            clusterBkg: "#1c1917",
            titleColor: "#e7e5e4",
            edgeLabelBackground: "#1c1917",
            fontSize: "14px",
          },
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900 rounded-xl text-red-400">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-medium text-sm">Diagram rendering failed</p>
          <p className="text-xs text-red-500 mt-1 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-stone-900/90 border border-stone-700 rounded-lg p-1">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="p-1.5 hover:bg-stone-700 rounded text-stone-400 hover:text-stone-200 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-stone-500 px-1 font-mono">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="p-1.5 hover:bg-stone-700 rounded text-stone-400 hover:text-stone-200 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1.5 hover:bg-stone-700 rounded text-stone-400 hover:text-stone-200 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-auto bg-stone-950 rounded-xl border border-stone-800 p-6 min-h-64">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s" }}
          ref={containerRef}
          className="mermaid-container"
        />
      </div>
    </div>
  );
}
