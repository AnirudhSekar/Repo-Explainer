"use client";

import { useAnalysisStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { FileSummary } from "@/types";
import { FileCode2, Layers, ChevronRight } from "lucide-react";

const COMPLEXITY_STYLES = {
  simple: "bg-green-950 border-green-900 text-green-400",
  moderate: "bg-yellow-950 border-yellow-900 text-yellow-400",
  complex: "bg-red-950 border-red-900 text-red-400",
};

interface FileSummaryCardProps {
  summary: FileSummary;
  isActive: boolean;
  onClick: () => void;
}

function FileSummaryCard({ summary, isActive, onClick }: FileSummaryCardProps) {
  const filename = summary.path.split("/").pop() ?? summary.path;
  const dir = summary.path.includes("/")
    ? summary.path.split("/").slice(0, -1).join("/")
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        isActive
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-stone-800 bg-stone-900/50 hover:border-stone-700 hover:bg-stone-900"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium text-stone-200 truncate">{filename}</p>
            {dir && <p className="text-xs text-stone-500 font-mono truncate">{dir}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "px-2 py-0.5 rounded border text-xs font-medium",
            COMPLEXITY_STYLES[summary.complexity]
          )}>
            {summary.complexity}
          </span>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isActive && "rotate-90 text-amber-400")} />
        </div>
      </div>

      <p className="mt-2 text-sm text-stone-400 line-clamp-2">{summary.purpose}</p>

      {isActive && summary.keyExports.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Layers className="w-3.5 h-3.5 text-stone-500 self-center" />
          {summary.keyExports.map((exp) => (
            <span key={exp} className="px-2 py-0.5 bg-stone-800 rounded text-xs font-mono text-stone-300">
              {exp}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

interface FileSummariesPanelProps {
  summaries: FileSummary[];
}

export function FileSummariesPanel({ summaries }: FileSummariesPanelProps) {
  const { activeFile, setActiveFile } = useAnalysisStore();

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <FileSummaryCard
          key={summary.path}
          summary={summary}
          isActive={activeFile === summary.path}
          onClick={() => setActiveFile(activeFile === summary.path ? null : summary.path)}
        />
      ))}
    </div>
  );
}
