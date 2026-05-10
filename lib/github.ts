import AdmZip from "adm-zip";
import { shouldSkipFile, isHighValueFile, getLanguage, truncateContent } from "@/lib/utils";

export interface RepoFile {
  path: string;
  content: string;
  language: string;
  size: number;
  priority: "high" | "normal";
}

export interface RepoMetadata {
  name: string;
  owner: string;
  description: string;
  defaultBranch: string;
  stars: number;
  language: string;
}

export interface RepoData {
  metadata: RepoMetadata;
  files: RepoFile[];
  allPaths: string[];
}

const MAX_FILES = 40;
const MAX_FILE_SIZE = 50_000;

const RATE_LIMIT_MSG =
  "RATE_LIMIT: GitHub API rate limit exhausted. You need a free GitHub token to use this app. " +
  "Go to github.com/settings/tokens → Generate new token (classic) → no scopes needed → paste below.";

function makeHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": "repolens/1.0" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// Check both status codes AND response body for rate limit errors
async function checkRateLimit(res: Response): Promise<void> {
  if (res.status === 403 || res.status === 429) {
    throw new Error(RATE_LIMIT_MSG);
  }

  // GitHub sometimes returns 200 with an error message in the body
  // Check for rate limit headers
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (remaining === "0") {
    throw new Error(RATE_LIMIT_MSG);
  }
}

export async function fetchRepo(
  owner: string,
  repo: string,
  token?: string
): Promise<RepoData> {
  const hdrs = makeHeaders(token);

  // ── Call 1: metadata ──────────────────────────────────────────────────
  console.log(`[repolens] Fetching metadata for ${owner}/${repo}...`);
  const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: hdrs });

  await checkRateLimit(metaRes);

  if (metaRes.status === 404) {
    throw new Error("Repo not found. Check the URL, or add a token for private repos.");
  }

  if (!metaRes.ok) {
    const body = await metaRes.text().catch(() => "");
    if (body.includes("rate limit") || body.includes("quota")) {
      throw new Error(RATE_LIMIT_MSG);
    }
    throw new Error(`GitHub error ${metaRes.status}: ${body.slice(0, 200)}`);
  }

  const meta = await metaRes.json();

  // Double check — GitHub can return 200 with an error message
  if (meta.message && (meta.message.includes("rate limit") || meta.message.includes("quota"))) {
    throw new Error(RATE_LIMIT_MSG);
  }

  const metadata: RepoMetadata = {
    name: meta.name,
    owner: meta.owner?.login ?? owner,
    description: meta.description ?? "",
    defaultBranch: meta.default_branch ?? "main",
    stars: meta.stargazers_count ?? 0,
    language: meta.language ?? "Unknown",
  };

  console.log(`[repolens] Downloading zip for ${owner}/${repo}...`);

  // ── Call 2: zip download (302 redirect to S3) ─────────────────────────
  const zipRedirect = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/zipball`,
    { headers: hdrs, redirect: "manual" }
  );

  await checkRateLimit(zipRedirect);

  const location = zipRedirect.headers.get("location");
  if (!location) {
    // Read body to check for rate limit message in non-302 responses
    const body = await zipRedirect.text().catch(() => "");
    if (body.includes("rate limit") || body.includes("quota")) {
      throw new Error(RATE_LIMIT_MSG);
    }
    throw new Error(`Zip download failed (${zipRedirect.status}). Add a GitHub token and try again.`);
  }

  // S3 URL — no auth needed
  const zipRes = await fetch(location);
  if (!zipRes.ok) throw new Error(`CDN download failed: ${zipRes.status}`);

  console.log(`[repolens] Extracting zip...`);

  // ── Extract ───────────────────────────────────────────────────────────
  const zip = new AdmZip(Buffer.from(await zipRes.arrayBuffer()));
  const entries = zip.getEntries();

  const prefix = (entries.find(e => e.isDirectory)?.entryName ?? "").split("/")[0] + "/";

  const allPaths: string[] = [];
  const candidates: Array<{ path: string; size: number; entry: AdmZip.IZipEntry }> = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const path = entry.entryName.startsWith(prefix)
      ? entry.entryName.slice(prefix.length)
      : entry.entryName;
    if (!path || shouldSkipFile(path)) continue;
    allPaths.push(path);
    if (entry.header.size > 0 && entry.header.size <= MAX_FILE_SIZE) {
      candidates.push({ path, size: entry.header.size, entry });
    }
  }

  candidates.sort((a, b) => {
    const aHigh = isHighValueFile(a.path) ? 0 : 1;
    const bHigh = isHighValueFile(b.path) ? 0 : 1;
    if (aHigh !== bHigh) return aHigh - bHigh;
    return a.size - b.size;
  });

  const files: RepoFile[] = [];
  for (const { path, size, entry } of candidates.slice(0, MAX_FILES)) {
    try {
      const content = entry.getData().toString("utf-8");
      if (content.includes("\0")) continue;
      files.push({
        path,
        content: truncateContent(content, 2500),
        language: getLanguage(path),
        size,
        priority: isHighValueFile(path) ? "high" : "normal",
      });
    } catch { /* skip */ }
  }

  console.log(`[repolens] Got ${files.length} files from ${allPaths.length} total`);
  return { metadata, files, allPaths };
}