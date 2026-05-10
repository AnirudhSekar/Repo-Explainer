import { cn } from "@/lib/utils";
import type { StackInfo } from "@/types";

const CATEGORY_STYLES: Record<string, string> = {
  languages: "bg-blue-950 border-blue-800 text-blue-300",
  frameworks: "bg-purple-950 border-purple-800 text-purple-300",
  databases: "bg-green-950 border-green-800 text-green-300",
  tools: "bg-stone-800 border-stone-700 text-stone-300",
};

interface BadgeProps {
  label: string;
  category: keyof typeof CATEGORY_STYLES;
}

function Badge({ label, category }: BadgeProps) {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg border text-xs font-medium",
      CATEGORY_STYLES[category]
    )}>
      {label}
    </span>
  );
}

interface StackBadgesProps {
  stack: StackInfo;
}

export function StackBadges({ stack }: StackBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {stack.languages.map((l) => <Badge key={l} label={l} category="languages" />)}
      {stack.frameworks.map((f) => <Badge key={f} label={f} category="frameworks" />)}
      {stack.databases.map((d) => <Badge key={d} label={d} category="databases" />)}
      {stack.tools.map((t) => <Badge key={t} label={t} category="tools" />)}
    </div>
  );
}
