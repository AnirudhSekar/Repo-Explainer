import { NextRequest } from "next/server";
import { z } from "zod";
import { formatRepoUrl, buildFileTree } from "@/lib/utils";
import { fetchRepo } from "@/lib/github";
import { detectStack, summarizeFiles, generateAllOutputs } from "@/lib/analyzer";
import { getCached, setCached, makeCacheKey } from "@/lib/cache";
import type { AnalysisResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const RequestSchema = z.object({
  url: z.string().url(),
  token: z.string().optional(),
  forceRefresh: z.boolean().optional(),
});

function sse(ctrl: ReadableStreamDefaultController, enc: TextEncoder, event: string, data: unknown) {
  ctrl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });

  const { url, token, forceRefresh } = parsed.data;
  const repoInfo = formatRepoUrl(url);
  if (!repoInfo) return new Response(JSON.stringify({ error: "Invalid GitHub URL" }), { status: 400 });

  const { owner, repo } = repoInfo;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const emit = (event: string, data: unknown) => sse(ctrl, enc, event, data);

      try {
        // Check cache
        if (!forceRefresh) {
          const cached = getCached(makeCacheKey(owner, repo));
          if (cached) {
            emit("progress", { step: "cache", message: "Cached!", progress: 100 });
            emit("result", cached);
            emit("done", {});
            ctrl.close();
            return;
          }
        }

        // Flush an initial progress event immediately so the connection is established
        emit("progress", { step: "fetching", message: `Downloading ${owner}/${repo}...`, progress: 5 });

        const githubToken = token || process.env.GITHUB_TOKEN;
        const { metadata, files, allPaths } = await fetchRepo(owner, repo, githubToken);
        emit("progress", { step: "fetching", message: `Got ${files.length} files`, progress: 30 });

        emit("progress", { step: "stack", message: "Detecting tech stack...", progress: 34 });
        const configFiles = files.filter(f =>
          /\.(json|toml|yaml|yml|env|dockerfile)$/i.test(f.path) ||
          /^dockerfile$/i.test(f.path.split("/").pop() ?? "")
        );
        const stack = await detectStack(configFiles);
        emit("progress", {
          step: "stack",
          message: `Stack: ${[...stack.languages, ...stack.frameworks].slice(0, 4).join(", ") || "detecting..."}`,
          progress: 40,
        });

        emit("progress", { step: "summarizing", message: `Analyzing ${files.length} files...`, progress: 44 });
        const sourceFiles = files.filter(f =>
          /\.(ts|tsx|js|jsx|py|go|rs|rb|java|cs|php|swift|kt)$/.test(f.path)
        );
        const summaries = await summarizeFiles(sourceFiles, stack);
        emit("progress", { step: "summarizing", message: "File analysis complete", progress: 65 });

        emit("progress", { step: "generating", message: "Generating docs...", progress: 68 });
        const outputs = await generateAllOutputs(repo, metadata.description, stack, summaries, configFiles);

        emit("progress", { step: "complete", message: "Done!", progress: 100 });

        const result: AnalysisResult = {
          repoUrl: url,
          repoName: metadata.name,
          owner: metadata.owner,
          description: metadata.description,
          stack,
          fileTree: buildFileTree(allPaths),
          fileSummaries: summaries,
          ...outputs,
          analyzedAt: new Date().toISOString(),
        };

        setCached(makeCacheKey(owner, repo), result);
        emit("result", result);
        emit("done", {});
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Analysis failed";
        console.error("[repolens] Error:", msg);
        emit("error", { message: msg });
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",  // Disable nginx buffering
    },
  });
}
