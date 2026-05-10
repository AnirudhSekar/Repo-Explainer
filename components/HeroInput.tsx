"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Sparkles, Lock } from "lucide-react";
import { useAnalysis } from "@/lib/useAnalysis";
import { useAnalysisStore } from "@/lib/store";

const EXAMPLE_REPOS = [
  "https://github.com/vercel/next.js",
  "https://github.com/fastapi/fastapi",
  "https://github.com/expressjs/express",
  "https://github.com/tiangolo/fastapi",
];

export function HeroInput() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const { analyze } = useAnalysis();
  const status = useAnalysisStore((s) => s.status);

  const isLoading = status !== "idle" && status !== "complete" && status !== "error";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    analyze(url.trim(), token.trim() || undefined);
  }

  function handleExample(exampleUrl: string) {
    setUrl(exampleUrl);
    analyze(exampleUrl, token.trim() || undefined);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 z-10" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="w-full pl-12 pr-36 py-4 bg-stone-900 border border-stone-700 rounded-2xl text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-lg font-mono"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-900 font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Explain
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
          >
            <Lock className="w-3 h-3" />
            {showToken ? "Hide" : "Add GitHub token"} (for private repos / higher rate limits)
          </button>
        </div>

        {showToken && (
          <motion.input
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_your_github_token_here"
            className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-all text-sm font-mono"
          />
        )}
      </form>

      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <span className="text-stone-500 text-sm self-center">Try:</span>
        {EXAMPLE_REPOS.map((repo) => (
          <button
            key={repo}
            onClick={() => handleExample(repo)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-stone-400 hover:text-stone-200 transition-all font-mono disabled:opacity-40"
          >
            {repo.replace("https://github.com/", "")}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
