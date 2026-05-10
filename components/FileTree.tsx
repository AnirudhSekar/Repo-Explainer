"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalysisStore } from "@/lib/store";
import type { FileNode } from "@/types";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "text-blue-400",
  JavaScript: "text-yellow-400",
  Python: "text-green-400",
  Go: "text-cyan-400",
  Rust: "text-orange-400",
  Ruby: "text-red-400",
  Java: "text-amber-400",
  CSS: "text-pink-400",
  HTML: "text-orange-300",
  JSON: "text-stone-400",
  Markdown: "text-stone-400",
  Docker: "text-blue-300",
  Shell: "text-green-300",
};

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  summaryPaths: Set<string>;
}

function FileTreeNode({ node, depth, summaryPaths }: FileTreeNodeProps) {
  const [open, setOpen] = useState(depth < 2);
  const { setActiveFile, setActiveTab } = useAnalysisStore();
  const isDir = node.type === "directory";
  const hasSummary = summaryPaths.has(node.path);

  function handleFileClick() {
    if (isDir) return;
    if (hasSummary) {
      setActiveFile(node.path);
      setActiveTab("files");
    }
  }

  const langColor = node.language ? LANGUAGE_COLORS[node.language] ?? "text-stone-400" : "";

  return (
    <div>
      <button
        onClick={isDir ? () => setOpen(!open) : handleFileClick}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-left transition-colors text-sm",
          "hover:bg-stone-800",
          !isDir && hasSummary && "cursor-pointer",
          !isDir && !hasSummary && "cursor-default opacity-60",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDir ? (
          <>
            {open
              ? <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />}
            {open
              ? <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              : <Folder className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
            <span className="text-stone-300 truncate">{node.name}</span>
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <File className={cn("w-3.5 h-3.5 shrink-0", langColor)} />
            <span className={cn("truncate", hasSummary ? "text-stone-200" : "text-stone-500")}>
              {node.name}
            </span>
            {hasSummary && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            )}
          </>
        )}
      </button>

      {isDir && open && node.children?.map((child) => (
        <FileTreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          summaryPaths={summaryPaths}
        />
      ))}
    </div>
  );
}

interface FileTreeProps {
  nodes: FileNode[];
  summaryPaths: string[];
}

export function FileTree({ nodes, summaryPaths }: FileTreeProps) {
  const pathSet = new Set(summaryPaths);

  return (
    <div className="space-y-0.5 font-mono">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          summaryPaths={pathSet}
        />
      ))}
    </div>
  );
}
