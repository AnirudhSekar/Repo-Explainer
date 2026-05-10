export type AnalysisStatus = "idle" | "fetching" | "analyzing" | "generating" | "complete" | "error";

export interface FileNode {
  path: string;
  name: string;
  type: "file" | "directory";
  language?: string;
  size?: number;
  children?: FileNode[];
}

export interface FileSummary {
  path: string;
  language: string;
  purpose: string;
  keyExports: string[];
  complexity: "simple" | "moderate" | "complex";
  snippet?: string;
}

export interface AnalysisResult {
  repoUrl: string;
  repoName: string;
  owner: string;
  description: string;
  stack: StackInfo;
  fileTree: FileNode[];
  fileSummaries: FileSummary[];
  architectureNarrative: string;
  mermaidDiagram: string;
  setupInstructions: string;
  juniorExplanation: string;
  analyzedAt: string;
}

export interface StackInfo {
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  archPattern: string;
}

export interface ProgressEvent {
  step: string;
  message: string;
  progress: number;
}
