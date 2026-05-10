import { create } from "zustand";
import type { AnalysisResult, AnalysisStatus, ProgressEvent } from "@/types";

interface AnalysisStore {
  status: AnalysisStatus;
  progress: ProgressEvent | null;
  result: AnalysisResult | null;
  error: string | null;
  activeTab: string;
  activeFile: string | null;

  setStatus: (status: AnalysisStatus) => void;
  setProgress: (progress: ProgressEvent) => void;
  setResult: (result: AnalysisResult) => void;
  setError: (error: string) => void;
  setActiveTab: (tab: string) => void;
  setActiveFile: (path: string | null) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as AnalysisStatus,
  progress: null,
  result: null,
  error: null,
  activeTab: "overview",
  activeFile: null,
};

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result, status: "complete" }),
  setError: (error) => set({ error, status: "error" }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveFile: (activeFile) => set({ activeFile }),
  reset: () => set(initialState),
}));
