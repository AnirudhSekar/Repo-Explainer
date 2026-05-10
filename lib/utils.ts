import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FileNode } from "@/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const LANGUAGE_MAP: Record<string, string> = {
  ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
  py: "Python", rb: "Ruby", go: "Go", rs: "Rust", java: "Java",
  cs: "C#", cpp: "C++", c: "C", php: "PHP", swift: "Swift",
  kt: "Kotlin", md: "Markdown", json: "JSON", yaml: "YAML",
  yml: "YAML", toml: "TOML", css: "CSS", scss: "SCSS",
  html: "HTML", sh: "Shell", bash: "Shell", dockerfile: "Docker",
  sql: "SQL", graphql: "GraphQL", proto: "Protobuf",
};

export function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const filename = path.split("/").pop()?.toLowerCase() ?? "";
  if (filename === "dockerfile") return "Docker";
  return LANGUAGE_MAP[ext] ?? ext.toUpperCase();
}

const SKIP_PATTERNS = [
  /node_modules/, /\.git\//, /dist\//, /build\//, /\.next\//,
  /coverage\//, /\.nyc_output/, /vendor\//, /\.cache\//,
  /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|mp3|pdf|zip|tar|gz)$/i,
  /package-lock\.json$/, /yarn\.lock$/, /pnpm-lock\.yaml$/,
];

export function shouldSkipFile(path: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(path));
}

const HIGH_VALUE_FILES = [
  /^(src\/)?index\.(ts|tsx|js|jsx)$/,
  /^(src\/)?app\.(ts|tsx|js|jsx)$/,
  /^(src\/)?main\.(ts|tsx|js|jsx|py|go|rs)$/,
  /^README\.md$/i,
  /^package\.json$/,
  /^(docker-)?compose\.ya?ml$/,
  /^Dockerfile$/,
  /^(src\/)?server\.(ts|js)$/,
  /^(src\/)?routes?\.(ts|js)$/,
];

export function isHighValueFile(path: string): boolean {
  const filename = path.split("/").pop() ?? "";
  return HIGH_VALUE_FILES.some((p) => p.test(filename) || p.test(path));
}

export function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode = { path: "", name: "root", type: "directory", children: [] };

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      if (!current.children) current.children = [];

      let node = current.children.find((c) => c.name === part);
      if (!node) {
        node = {
          path: currentPath,
          name: part,
          type: isLast ? "file" : "directory",
          language: isLast ? getLanguage(filePath) : undefined,
          children: isLast ? undefined : [],
        };
        current.children.push(node);
      }
      current = node;
    }
  }

  return root.children ?? [];
}

export function formatRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export function truncateContent(content: string, maxChars = 3000): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + "\n\n[... truncated for brevity ...]";
}
