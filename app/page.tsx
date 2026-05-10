"use client";

import { useState, useRef, useEffect } from "react";
import s from "./page.module.css";

type Status = "idle" | "loading" | "done" | "error";

interface FileSummary {
  path: string; language: string; purpose: string;
  keyExports: string[]; complexity: "simple" | "moderate" | "complex";
}
interface StackInfo {
  languages: string[]; frameworks: string[];
  databases: string[]; tools: string[]; archPattern: string;
}
interface Result {
  repoName: string; owner: string; description: string; stack: StackInfo;
  fileSummaries: FileSummary[]; architectureNarrative: string;
  mermaidDiagram: string; setupInstructions: string;
  juniorExplanation: string; analyzedAt: string;
}
interface Progress { step: string; message: string; progress: number; }

const EXAMPLES = ["vercel/next.js", "fastapi/fastapi", "expressjs/express", "facebook/react"];
const STEPS = ["01 FETCH", "02 PARSE", "03 REASON", "04 DONE"];
const COMPLEXITY_COLOR: Record<string, string> = {
  simple: "#39d353", moderate: "#e3b341", complex: "#f85149",
};

function md(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/```[\w]*\n([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<div class="li"><span class="li-b">▸</span><span class="li-t">$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="li"><span class="li-b">→</span><span class="li-t">$1</span></div>')
    .replace(/\n\n/g, '<p></p>');
}

function Dot({ pulse = false, size = 6 }: { pulse?: boolean; size?: number }) {
  return (
    <span className={pulse ? s.pulse : ""}
      style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: "#39d353", flexShrink: 0 }} />
  );
}

function FileCard({ file }: { file: FileSummary }) {
  const [open, setOpen] = useState(false);
  const name = file.path.split("/").pop() ?? file.path;
  const dir  = file.path.includes("/") ? file.path.split("/").slice(0, -1).join("/") + "/" : "";
  const col  = COMPLEXITY_COLOR[file.complexity];

  return (
    <div className={`${s.fileCard} ${open ? s.fileCardOpen : ""}`}
      onClick={() => setOpen(!open)} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && setOpen(!open)}>
      <div className={s.fileBody}>
        <div className={s.fileBar} style={{ background: col }} />
        <div className={s.fileInner}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#e6edf3", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              {dir && <div style={{ fontSize: 10, color: "#484f58", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span className={s.tag} style={{ border: `1px solid ${col}44`, background: `${col}11`, color: col, fontSize: 10 }}>
                {file.complexity.toUpperCase()}
              </span>
              <span style={{ color: "#484f58", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div className={s.fileExpand}>
          <p style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.7, margin: "0 0 8px" }}>{file.purpose}</p>
          {file.keyExports.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {file.keyExports.map(e => (
                <code key={e} style={{ fontSize: 10, padding: "2px 6px", background: "#080b0f", border: "1px solid #21262d", color: "#39d353", borderRadius: 3, fontFamily: "inherit" }}>{e}</code>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComplexityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
        <span style={{ color, letterSpacing: "0.1em" }}>{label}</span>
        <span style={{ color: "#484f58" }}>{count}</span>
      </div>
      <div style={{ height: 2, background: "#21262d", borderRadius: 1 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 1, transition: "width .5s ease" }} />
      </div>
    </div>
  );
}

function StackBadges({ stack }: { stack: StackInfo }) {
  const rows = [
    { label: "LANG",      items: stack.languages,  color: "#58a6ff" },
    { label: "FRAMEWORK", items: stack.frameworks, color: "#bc8cff" },
    { label: "DB",        items: stack.databases,  color: "#39d353" },
    { label: "TOOLS",     items: stack.tools,      color: "#8b949e" },
  ].filter(r => r.items.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(r => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "#484f58", width: 70, flexShrink: 0, letterSpacing: "0.1em" }}>{r.label}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {r.items.map(item => (
              <span key={item} className={s.tag} style={{ border: `1px solid ${r.color}33`, background: `${r.color}0d`, color: r.color }}>{item}</span>
            ))}
          </div>
        </div>
      ))}
      {stack.archPattern && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "#484f58", width: 70, flexShrink: 0, letterSpacing: "0.1em" }}>PATTERN</span>
          <span style={{ fontSize: 11, color: "#8b949e" }}>{stack.archPattern}</span>
        </div>
      )}
    </div>
  );
}

type TabId = "overview" | "files" | "diagram" | "setup" | "junior";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "// Overview"    },
  { id: "files",    label: "// Files"       },
  { id: "diagram",  label: "// Diagram"     },
  { id: "setup",    label: "// Setup"       },
  { id: "junior",   label: "// For Juniors" },
];

function ResultsView({ result }: { result: Result }) {
  const [tab, setTab] = useState<TabId>("overview");
  const total = result.fileSummaries.length;

  return (
    <div className={s.fade}>
      <div className={s.repoHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "#484f58", border: "1px solid #21262d", padding: "2px 7px", borderRadius: 3, letterSpacing: "0.12em" }}>REPO</span>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                <span style={{ color: "#484f58" }}>{result.owner}/</span>
                <span style={{ color: "#39d353" }}>{result.repoName}</span>
              </h2>
            </div>
            {result.description && <p style={{ fontSize: 13, color: "#8b949e", margin: "0 0 16px", lineHeight: 1.6 }}>{result.description}</p>}
            <StackBadges stack={result.stack} />
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#484f58", letterSpacing: "0.12em" }}>ANALYZED</div>
            <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>
              {new Date(result.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 10 }}>
              <Dot pulse size={6} />
              <span style={{ fontSize: 10, color: "#39d353", letterSpacing: "0.1em" }}>READY</span>
            </div>
          </div>
        </div>
      </div>

      <div className={s.resultsGrid}>
        <div className={s.sidebar}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`${s.tab} ${tab === t.id ? s.tabActive : ""}`}>
              {t.label}
              {t.id === "files" && (
                <span style={{ marginLeft: 8, fontSize: 10, padding: "1px 5px", border: "1px solid #21262d", borderRadius: 3, color: "#484f58" }}>{total}</span>
              )}
            </button>
          ))}
          <div className={s.complexityWidget}>
            <div style={{ fontSize: 10, color: "#484f58", letterSpacing: "0.15em", marginBottom: 12 }}>COMPLEXITY</div>
            <ComplexityBar label="SIMPLE"   count={result.fileSummaries.filter(f => f.complexity === "simple").length}   total={total} color="#39d353" />
            <ComplexityBar label="MODERATE" count={result.fileSummaries.filter(f => f.complexity === "moderate").length} total={total} color="#e3b341" />
            <ComplexityBar label="COMPLEX"  count={result.fileSummaries.filter(f => f.complexity === "complex").length}  total={total} color="#f85149" />
          </div>
        </div>

        <div className={s.panel}>
          <div className={s.panelChrome}>
            <span style={{ fontSize: 11, color: "#484f58" }}>{TABS.find(t => t.id === tab)?.label}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["#f85149","#e3b341","#39d353"].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.75 }} />
              ))}
            </div>
          </div>
          <div style={{ padding: 24 }}>
            {tab === "overview" && <div className={s.mdWrap} dangerouslySetInnerHTML={{ __html: md(result.architectureNarrative) }} />}
            {tab === "files" && (
              <div>
                <p style={{ fontSize: 11, color: "#484f58", marginBottom: 14 }}>{total} files analyzed — click to expand</p>
                {result.fileSummaries.map(f => <FileCard key={f.path} file={f} />)}
              </div>
            )}
            {tab === "diagram" && (
              <div>
                <p style={{ fontSize: 11, color: "#484f58", marginBottom: 14 }}>
                  Paste at <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" style={{ color: "#39d353" }}>mermaid.live</a> to render
                </p>
                <div style={{ background: "#080b0f", border: "1px solid #21262d", borderRadius: 6, padding: 20, overflowX: "auto" }}>
                  <pre style={{ margin: 0, fontSize: 11, color: "#39d353", lineHeight: 1.7, fontFamily: "inherit", whiteSpace: "pre-wrap" }}>{result.mermaidDiagram}</pre>
                </div>
                <a href={`https://mermaid.live/edit#base64:${btoa(result.mermaidDiagram)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, padding: "8px 16px", border: "1px solid rgba(57,211,83,0.35)", color: "#39d353", fontSize: 11, borderRadius: 6, background: "rgba(57,211,83,0.05)", textDecoration: "none" }}>
                  → Open in Mermaid.live
                </a>
              </div>
            )}
            {tab === "setup" && <div className={s.mdWrap} dangerouslySetInnerHTML={{ __html: md(result.setupInstructions) }} />}
            {tab === "junior" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid rgba(57,211,83,0.25)", background: "rgba(57,211,83,0.05)", borderRadius: 6, marginBottom: 24 }}>
                  <Dot size={5} />
                  <span style={{ fontSize: 11, color: "#39d353", letterSpacing: "0.1em" }}>EXPLAIN THIS CODEBASE TO A JUNIOR ENGINEER</span>
                </div>
                <div className={s.mdWrap} dangerouslySetInnerHTML={{ __html: md(result.juniorExplanation) }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputBox({ url, setUrl, token, setToken, showToken, setShowToken, onSubmit, isLoading, inputRef, compact, isRateLimit }: {
  url: string; setUrl: (v: string) => void; token: string; setToken: (v: string) => void;
  showToken: boolean; setShowToken: (v: boolean) => void; onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean; inputRef?: React.RefObject<HTMLInputElement | null>; compact?: boolean; isRateLimit?: boolean;
}) {
  return (
    <div style={{ maxWidth: 640, width: "100%" }}>
      <form onSubmit={onSubmit}>
        <div className={s.inputWrap}>
          <span className={s.dollar}>$</span>
          <input ref={inputRef} type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder={compact ? "analyze another repo..." : "github.com/owner/repo"}
            className={s.input} />
          {compact
            ? <button type="submit" className={s.runBtnSm}>RUN →</button>
            : <button type="submit" disabled={!url.trim() || isLoading} className={s.runBtn}>RUN →</button>
          }
        </div>
      </form>
      {!compact && (
        <>
          {isRateLimit ? (
            <div style={{ marginTop: 12, padding: "12px 14px", border: "1px solid rgba(227,179,65,0.4)", borderRadius: 8, background: "rgba(227,179,65,0.05)" }}>
              <div style={{ fontSize: 11, color: "#e3b341", fontWeight: 600, marginBottom: 6 }}>⚠ GitHub rate limit hit — a free token fixes this</div>
              <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 10, lineHeight: 1.6 }}>
                1. Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: "#39d353" }}>github.com/settings/tokens</a><br/>
                2. Click &quot;Generate new token (classic)&quot;<br/>
                3. No scopes needed — just scroll down and click Generate<br/>
                4. Paste it below and run again
              </div>
              <input type="password" value={token} onChange={e => setToken(e.target.value)}
                placeholder="ghp_..." className={s.tokenInput} style={{ marginTop: 0 }} autoFocus />
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setShowToken(!showToken)} className={s.tokenToggle}>
                {showToken ? "▼" : "▶"} github token — private repos &amp; higher rate limits
              </button>
              {showToken && (
                <input type="password" value={token} onChange={e => setToken(e.target.value)}
                  placeholder="ghp_..." className={s.tokenInput} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const [url,       setUrl]       = useState("");
  const [token,     setToken]     = useState("");
  const [showToken, setShowToken] = useState(false);
  const [status,    setStatus]    = useState<Status>("idle");
  const [progress,  setProgress]  = useState<Progress | null>(null);
  const [result,    setResult]    = useState<Result | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "loading";
  const showHero  = status === "idle" || status === "error";
  const stepIdx   = !progress ? 0
    : progress.step.includes("fetch") ? 0
    : progress.step === "stack" || progress.step.includes("summar") ? 1
    : progress.step === "complete" ? 3 : 2;

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function analyze(repoUrl: string) {
    if (!repoUrl.trim() || isLoading) return;
    const fullUrl = repoUrl.startsWith("http") ? repoUrl : `https://github.com/${repoUrl}`;
    setStatus("loading"); setResult(null); setError(null); setProgress(null); setIsRateLimit(false);

    const res = await fetch("/api/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fullUrl, token: token.trim() || undefined }),
    });
    if (!res.ok) { setError("Analysis failed — check the URL and try again."); setStatus("error"); return; }
    const reader = res.body?.getReader();
    if (!reader) { setError("Streaming not supported."); setStatus("error"); return; }

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";

    function processLine(line: string) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (currentEvent === "progress") setProgress(data);
          else if (currentEvent === "result") { setResult(data); setStatus("done"); }
          else if (currentEvent === "error") {
            const msg: string = data.message ?? data.error ?? JSON.stringify(data);
            const lower = msg.toLowerCase();
            const isGitHubRL = lower.includes("rate limit") || lower.includes("rate_limit") || (lower.includes("quota") && lower.includes("github"));
            const isGeminiRL = lower.includes("429") || (lower.includes("quota") && lower.includes("gemini"));
            if (isGitHubRL) { setIsRateLimit(true); setShowToken(true); }
            setError(msg.replace("RATE_LIMIT: ", ""));
            setStatus("error");
          }
        } catch (parseErr) {
          // JSON parse failed — show the raw data as the error
          console.error("[repolens] Failed to parse SSE data:", line.slice(6));
          if (currentEvent === "error") {
            setError(line.slice(6));
            setStatus("error");
          }
        }
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) processLine(line);
    }
    // Process any remaining data in the buffer after stream ends
    if (buffer.trim()) {
      for (const line of buffer.split("\n")) processLine(line);
    }
    // If we finished loading but never got a result or error, show a generic error
    if (status === "loading" as Status) {
      setError("Analysis ended unexpectedly. Try again or add a GitHub token.");
      setStatus("error");
    }
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); analyze(url); }
  const inputProps = { url, setUrl, token, setToken, showToken, setShowToken, onSubmit: handleSubmit, isLoading, isRateLimit };

  return (
    <div className={s.root}>
      <div className={s.glow} />
      <div className={s.scanlines} />
      <div className={s.topBar} />

      <header className={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className={s.logo}>
            <span style={{ color: "#39d353" }}>REPO</span>
            <span style={{ color: "#e6edf3" }}>LENS</span>
          </div>
          <span style={{ fontSize: 11, color: "#484f58" }}>// AI-powered codebase explainer</span>
        </div>
        <div className={s.headerRight}>
          <Dot pulse size={6} />
          <span style={{ fontSize: 10, color: "#484f58", letterSpacing: "0.12em" }}>GEMINI 2.0 FLASH</span>
        </div>
      </header>

      <main className={s.main}>
        {/* Error — always at the top, never buried */}
        {error && (
          <div style={{ marginTop: 32, marginBottom: 8 }}>
            {isRateLimit ? (
              <div style={{ padding: "20px 24px", border: "1px solid rgba(227,179,65,0.5)", borderRadius: 10, background: "rgba(227,179,65,0.06)" }}>
                <div style={{ fontSize: 13, color: "#e3b341", fontWeight: 600, marginBottom: 10 }}>
                  ⚠ Rate limit hit — add a GitHub token to continue
                </div>
                <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 10, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 6, fontFamily: "inherit", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {error}
                </div>
                <div style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.8, marginBottom: 14 }}>
                  1. Go to{" "}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer"
                    style={{ color: "#39d353" }}>github.com/settings/tokens</a>
                  <br />
                  2. Click <strong style={{ color: "#e6edf3" }}>&quot;Generate new token (classic)&quot;</strong>
                  <br />
                  3. No scopes needed — scroll to bottom and click Generate
                  <br />
                  4. Paste it below and hit RUN again
                </div>
                <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, maxWidth: 560 }}>
                  <input type="password" value={token} onChange={e => setToken(e.target.value)}
                    placeholder="ghp_your_token_here" autoFocus
                    style={{ flex: 1, padding: "10px 14px", background: "#0d1117", border: "1px solid rgba(227,179,65,0.4)", borderRadius: 6, color: "#e6edf3", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  <button type="submit" disabled={!token.trim()}
                    style={{ padding: "10px 20px", background: "#e3b341", color: "#080b0f", fontWeight: 600, fontSize: 12, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", opacity: token.trim() ? 1 : 0.4 }}>
                    RUN →
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: "14px 18px", border: "1px solid rgba(248,81,73,0.4)", borderRadius: 8, background: "rgba(248,81,73,0.05)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#f85149", fontSize: 11, flexShrink: 0, letterSpacing: "0.08em", marginTop: 1 }}>ERR</span>
                <p style={{ fontSize: 12, color: "#8b949e", margin: 0, lineHeight: 1.6 }}>{error}</p>
              </div>
            )}
          </div>
        )}

        {showHero && (
          <div className={`${s.hero} ${s.fade}`} style={{ paddingTop: error ? 24 : undefined }}>
            {!error && <div className={`${s.eyebrow} ${s.fade1}`}>
              <Dot pulse size={5} /> v2.0 — UNDERSTAND ANY CODEBASE
            </div>}

            {!error && <h1 className={`${s.headline} ${s.fade1}`}>
              <div className={s.headlineWhite}>PASTE A REPO.</div>
              <div className={s.headlineGreen}>UNDERSTAND</div>
              <div className={s.headlineWhite}>EVERYTHING.</div>
            </h1>}

            {!error && <p className={`${s.subline} ${s.fade2}`}>
              Architecture diagrams. File-by-file explanations. Setup instructions.
              A guide for junior engineers. All from one URL.
            </p>}

            {!isRateLimit && <div className={s.fade3}>
              <InputBox {...inputProps} inputRef={inputRef} />
            </div>}

            <div className={`${s.examples} ${s.fade3}`}>
              <span className={s.exampleLabel}>TRY →</span>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setUrl(ex); analyze(ex); }} className={s.exampleBtn}>{ex}</button>
              ))}
            </div>

            <div className={s.features}>
              {[
                { num: "01", icon: "⬡", label: "Architecture", sub: "Mermaid diagrams of how components connect" },
                { num: "02", icon: "▦", label: "File Map",      sub: "Plain-English purpose for every source file" },
                { num: "03", icon: "▶", label: "Setup Guide",   sub: "Step-by-step instructions with context" },
                { num: "04", icon: "◈", label: "Junior Mode",   sub: '"Explain this codebase to a junior engineer"' },
              ].map(f => (
                <div key={f.num} className={s.featureCard}>
                  <div className={s.featureNum}>{f.num}</div>
                  <div className={s.featureTitle}>
                    <span className={s.featureIcon}>{f.icon}</span>
                    {f.label.toUpperCase()}
                  </div>
                  <div className={s.featureSub}>{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}



        {isLoading && (
          <div className={`${s.loading} ${s.fade}`}>
            <div className={s.progressTrack}>
              <div className={s.progressFill} style={{ width: `${progress?.progress ?? 0}%` }} />
            </div>
            <div className={s.steps}>
              {STEPS.map((step, i) => (
                <div key={step} className={`${s.step} ${i === stepIdx ? s.stepActive : i < stepIdx ? s.stepDone : ""}`}>
                  <div>{step}</div>
                  <div style={{ marginTop: 3, fontSize: 9 }}>{i < stepIdx ? "✓ OK" : i === stepIdx ? "●" : "···"}</div>
                </div>
              ))}
            </div>
            <div className={s.terminal}>
              <div className={s.terminalChrome}>
                <div className={s.termDot} style={{ background: "#f85149" }} />
                <div className={s.termDot} style={{ background: "#e3b341" }} />
                <div className={s.termDot} style={{ background: "#39d353" }} />
                <span style={{ fontSize: 10, color: "#484f58", marginLeft: 8 }}>repolens — analysis</span>
              </div>
              <div className={s.terminalBody}>
                <span style={{ userSelect: "none" }}>$</span>
                <span>{progress?.message ?? "initializing..."}</span>
                <span className={s.cursor}>_</span>
              </div>
            </div>
          </div>
        )}

        {status === "done" && result && (
          <div style={{ paddingTop: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <InputBox {...inputProps} compact />
            </div>
            <ResultsView result={result} />
          </div>
        )}
      </main>

      <footer className={s.footer}>
        <span style={{ fontSize: 10, color: "#484f58", letterSpacing: "0.12em" }}>REPOLENS // NEXT.JS + GEMINI 2.0</span>
        <span style={{ fontSize: 10, color: "#484f58" }}>2026</span>
      </footer>
    </div>
  );
}