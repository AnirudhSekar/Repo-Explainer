"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FileTree } from "@/components/FileTree";
import { MermaidDiagram } from "@/components/diagrams/MermaidDiagram";
import { Markdown } from "@/components/Markdown";
import { StackBadges } from "@/components/StackBadges";
import { FileSummariesPanel } from "@/components/FileSummariesPanel";
import {
  Star, GitFork, Layers, FileCode2, Network,
  Terminal, BookOpen, RotateCcw, ExternalLink, GraduationCap
} from "lucide-react";
import { useAnalysis } from "@/lib/useAnalysis";

const TABS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "diagram", label: "Architecture", icon: Network },
  { id: "files", label: "Files", icon: FileCode2 },
  { id: "setup", label: "Setup", icon: Terminal },
  { id: "junior", label: "For Juniors", icon: GraduationCap },
];

export function ResultsDashboard() {
  const { result, activeTab, setActiveTab } = useAnalysisStore();
  const { analyze } = useAnalysis();

  if (!result) return null;

  function handleRefresh() {
    analyze(result!.repoUrl, undefined, true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto"
    >
      {/* Repo header */}
      <div className="mb-6 p-5 bg-stone-900 border border-stone-800 rounded-2xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-stone-100 font-mono">
                {result.owner}/{result.repoName}
              </h2>
              <a
                href={result.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-amber-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            {result.description && (
              <p className="text-stone-400 text-sm">{result.description}</p>
            )}
            <div className="mt-3">
              <StackBadges stack={result.stack} />
            </div>
            {result.stack.archPattern && (
              <div className="mt-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-stone-500">
                  Architecture: <span className="text-stone-300">{result.stack.archPattern}</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-mono">
              analyzed {new Date(result.analyzedAt).toLocaleDateString()}
            </span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-stone-400 hover:text-stone-200 transition-all text-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-900 border border-stone-800 rounded-xl p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                activeTab === tab.id
                  ? "bg-amber-500 text-stone-900"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File tree sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sticky top-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5" />
              File Tree
            </h3>
            <div className="text-xs text-stone-600 mb-2 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500" />
              Amber dot = analyzed
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
              <FileTree
                nodes={result.fileTree}
                summaryPaths={result.fileSummaries.map((s) => s.path)}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            {activeTab === "overview" && (
              <Markdown content={result.architectureNarrative} />
            )}

            {activeTab === "diagram" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-stone-100 mb-1">Architecture Diagram</h3>
                  <p className="text-stone-500 text-sm mb-4">
                    Visual map of how the major components connect and interact.
                  </p>
                </div>
                <MermaidDiagram chart={result.mermaidDiagram} />
                <details className="group">
                  <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-300 transition-colors">
                    View raw Mermaid source
                  </summary>
                  <pre className="mt-2 p-3 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-400 overflow-x-auto">
                    {result.mermaidDiagram}
                  </pre>
                </details>
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-stone-100 mb-1">
                    File Analysis
                    <span className="ml-2 text-sm font-normal text-stone-500">
                      ({result.fileSummaries.length} files)
                    </span>
                  </h3>
                  <p className="text-stone-500 text-sm mb-4">
                    Click a file to see what it exports. Files with an amber dot have been analyzed.
                  </p>
                </div>
                <FileSummariesPanel summaries={result.fileSummaries} />
              </div>
            )}

            {activeTab === "setup" && (
              <Markdown content={result.setupInstructions} />
            )}

            {activeTab === "junior" && (
              <div>
                <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-amber-300 text-sm font-medium">
                    Explain this codebase to a junior engineer
                  </p>
                </div>
                <Markdown content={result.juniorExplanation} />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
