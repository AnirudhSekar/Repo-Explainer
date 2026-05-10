"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { GitBranch, Search, Brain, Wand2, CheckCircle2 } from "lucide-react";

const STEPS = [
  { key: "fetching", label: "Fetching repo", icon: GitBranch },
  { key: "analyzing", label: "Analyzing code", icon: Search },
  { key: "generating", label: "Generating insights", icon: Brain },
  { key: "complete", label: "Complete", icon: CheckCircle2 },
];

const STATUS_STEP_MAP: Record<string, number> = {
  fetching: 0,
  analyzing: 1,
  generating: 2,
  complete: 3,
};

export function ProgressIndicator() {
  const { status, progress } = useAnalysisStore();
  const currentStepIndex = STATUS_STEP_MAP[status] ?? 0;

  if (status === "idle" || status === "error") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Progress bar */}
      <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-amber-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress?.progress ?? 0}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between mb-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isDone && "bg-amber-500 border-amber-500 text-stone-900",
                  isActive && "border-amber-500 text-amber-400 bg-amber-500/10",
                  !isActive && !isDone && "border-stone-700 text-stone-600"
                )}
              >
                {isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Wand2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                isActive && "text-amber-400",
                isDone && "text-stone-400",
                !isActive && !isDone && "text-stone-600"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current message */}
      {progress && (
        <motion.p
          key={progress.message}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-stone-400 text-sm font-mono"
        >
          {progress.message}
        </motion.p>
      )}
    </motion.div>
  );
}
