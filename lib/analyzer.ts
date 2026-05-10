import { GoogleGenerativeAI } from "@google/generative-ai";
import type { StackInfo, FileSummary } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-2.0-flash";

async function callGemini(prompt: string, system: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: system });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

const JUNIOR_SYSTEM = `You are a senior engineer explaining code to a junior developer.
Use clear, friendly language. Avoid jargon. Use analogies. Always explain WHY, not just WHAT.
Be encouraging and specific.`;

export async function detectStack(
  configFiles: Array<{ path: string; content: string }>
): Promise<StackInfo> {
  if (configFiles.length === 0) {
    return { languages: [], frameworks: [], databases: [], tools: [], archPattern: "Unknown" };
  }
  // Only send the first 5 config files — enough to detect the stack
  const filesText = configFiles.slice(0, 5)
    .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 800)}`)
    .join("\n\n");

  const raw = await callGemini(
    `Analyze these config files and return ONLY valid JSON (no markdown, no backticks):
${filesText}
Return this exact shape: {"languages":[],"frameworks":[],"databases":[],"tools":[],"archPattern":""}`,
    "Return ONLY raw JSON, no markdown fences, no explanation."
  );

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { languages: [], frameworks: [], databases: [], tools: [], archPattern: "Unknown" };
  }
}

export async function summarizeFiles(
  files: Array<{ path: string; content: string; language: string }>,
  stackInfo: StackInfo
): Promise<FileSummary[]> {
  // Larger batches = fewer LLM calls = much faster
  const BATCH_SIZE = 10;
  const stackCtx = `Stack: ${stackInfo.languages.join(", ")} / ${stackInfo.frameworks.join(", ")}`;

  // Run ALL batches in parallel instead of sequentially
  const batches = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    batches.push(files.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const filesText = batch
        .map((f) => `=== ${f.path} (${f.language}) ===\n${f.content}`)
        .join("\n\n");

      const raw = await callGemini(
        `${stackCtx}

Analyze these files. Return ONLY a valid JSON array, no markdown:
${filesText}

Shape: [{"path":"","language":"","purpose":"1-2 sentences for a junior dev","keyExports":[],"complexity":"simple|moderate|complex"}]`,
        JUNIOR_SYSTEM
      );

      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return batch.map((f) => ({
          path: f.path, language: f.language,
          purpose: "Could not summarize this file.",
          keyExports: [], complexity: "simple" as const,
        }));
      }
    })
  );

  return batchResults.flat();
}

export async function generateArchitectureNarrative(
  repoName: string,
  stack: StackInfo,
  summaries: FileSummary[]
): Promise<string> {
  const summaryText = summaries.slice(0, 20)
    .map((s) => `${s.path}: ${s.purpose}`)
    .join("\n");

  return callGemini(
    `Project: ${repoName}
Stack: ${JSON.stringify(stack)}
Files:
${summaryText}

Write a "How This Project Works" narrative for a junior engineer:
1. What this project does (2-3 sentences)
2. Main pieces and how they connect (use analogies)
3. Journey of a typical request through the codebase
4. What makes this architecture interesting

Use markdown. Be encouraging and specific.`,
    JUNIOR_SYSTEM
  );
}

export async function generateMermaidDiagram(
  stack: StackInfo,
  summaries: FileSummary[]
): Promise<string> {
  const keyFiles = summaries
    .filter((s) => s.complexity !== "simple" || s.keyExports.length > 0)
    .slice(0, 15)
    .map((s) => `${s.path}: ${s.purpose.slice(0, 50)}`)
    .join("\n");

  const raw = await callGemini(
    `Create a Mermaid architecture diagram.
Stack: ${stackInfo(stack)}
Key files:
${keyFiles}

Return ONLY Mermaid syntax starting with "graph TD". Max 12 nodes. No explanation.`,
    "Return ONLY Mermaid diagram syntax, nothing else."
  );

  return raw.replace(/```mermaid|```/g, "").trim();
}

export async function generateSetupInstructions(
  repoName: string,
  stack: StackInfo,
  configFiles: Array<{ path: string; content: string }>
): Promise<string> {
  const configText = configFiles.slice(0, 3)
    .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 400)}`)
    .join("\n\n");

  return callGemini(
    `Project: ${repoName}
Stack: ${stackInfo(stack)}
Config files:
${configText}

Write setup instructions for a junior engineer. Include:
1. Prerequisites and why they matter
2. Installation steps with explanations
3. Environment variables needed
4. How to run in development
5. Common issues and fixes

Use markdown.`,
    JUNIOR_SYSTEM
  );
}

export async function generateJuniorExplanation(
  repoName: string,
  description: string,
  stack: StackInfo,
  narrative: string
): Promise<string> {
  return callGemini(
    `Project: ${repoName}
Description: ${description}
Stack: ${stackInfo(stack)}
Summary: ${narrative.slice(0, 400)}

Write an "Explain this codebase to a junior engineer" guide. Include:
- What problem this solves (real-world analogy)
- The core insight that makes it click
- 3-5 things to look at first and why
- Skills they'll learn by contributing
- Encouraging closing

Use markdown. Be warm and specific.`,
    JUNIOR_SYSTEM
  );
}

// ── Parallel generation: run narrative + diagram + setup + junior all at once ──
export async function generateAllOutputs(
  repoName: string,
  description: string,
  stack: StackInfo,
  summaries: FileSummary[],
  configFiles: Array<{ path: string; content: string }>
): Promise<{
  architectureNarrative: string;
  mermaidDiagram: string;
  setupInstructions: string;
  juniorExplanation: string;
}> {
  const [architectureNarrative, mermaidDiagram, setupInstructions] = await Promise.all([
    generateArchitectureNarrative(repoName, stack, summaries),
    generateMermaidDiagram(stack, summaries),
    generateSetupInstructions(repoName, stack, configFiles),
  ]);

  // Junior explanation uses the narrative so runs after
  const juniorExplanation = await generateJuniorExplanation(
    repoName, description, stack, architectureNarrative
  );

  return { architectureNarrative, mermaidDiagram, setupInstructions, juniorExplanation };
}

function stackInfo(stack: StackInfo): string {
  return [...stack.languages, ...stack.frameworks].join(", ") || "Unknown";
}
