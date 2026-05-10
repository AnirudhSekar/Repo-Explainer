import { useState, useRef, useEffect } from 'react'
import './index.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'idle' | 'loading' | 'done' | 'error'

interface FileSummary {
  path: string
  language: string
  purpose: string
  keyExports: string[]
  complexity: 'simple' | 'moderate' | 'complex'
}

interface StackInfo {
  languages: string[]
  frameworks: string[]
  databases: string[]
  tools: string[]
  archPattern: string
}

interface Result {
  repoName: string
  owner: string
  description: string
  stack: StackInfo
  fileSummaries: FileSummary[]
  architectureNarrative: string
  mermaidDiagram: string
  setupInstructions: string
  juniorExplanation: string
  analyzedAt: string
}

interface Progress {
  step: string
  message: string
  progress: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EXAMPLES = [
  'vercel/next.js',
  'fastapi/fastapi',
  'expressjs/express',
  'facebook/react',
]

const STEPS = [
  { key: 'fetching', label: '01 / FETCH' },
  { key: 'analyzing', label: '02 / PARSE' },
  { key: 'generating', label: '03 / REASON' },
  { key: 'complete', label: '04 / DONE' },
]

const STATUS_TO_STEP: Record<string, number> = {
  fetching: 0, analyzing: 1, generating: 2, complete: 3
}

const COMPLEXITY_COLOR: Record<string, string> = {
  simple: 'text-[#39d353] border-[#39d353]/30 bg-[#39d353]/5',
  moderate: 'text-[#e3b341] border-[#e3b341]/30 bg-[#e3b341]/5',
  complex: 'text-[#f85149] border-[#f85149]/30 bg-[#f85149]/5',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-display font-700 text-[#e6edf3] mt-6 mb-2 uppercase tracking-widest">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-display font-700 text-[#e6edf3] mt-8 mb-3 uppercase tracking-widest border-b border-[#21262d] pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-display font-800 text-[#39d353] mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e6edf3] font-600">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-[#161b22] border border-[#21262d] rounded text-[#39d353] text-xs">$1</code>')
    .replace(/^```[\w]*\n([\s\S]*?)```$/gm, '<pre class="bg-[#0d1117] border border-[#21262d] rounded p-4 text-xs overflow-x-auto my-3 text-[#8b949e]"><code>$1</code></pre>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-[#39d353] shrink-0">▸</span><span class="text-[#8b949e]">$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-1 text-[#8b949e]"><span class="text-[#39d353] shrink-0">→</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TerminalLine({ children, dim = false, green = false }: { children: React.ReactNode; dim?: boolean; green?: boolean }) {
  return (
    <div className={`flex gap-2 text-xs leading-6 ${dim ? 'text-[#484f58]' : green ? 'text-[#39d353]' : 'text-[#8b949e]'}`}>
      <span className="text-[#39d353] select-none shrink-0">$</span>
      {children}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-2 py-0.5 border rounded text-xs font-mono ${color}`}>
      {label}
    </span>
  )
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-[#484f58] text-xs font-mono">{number}</span>
      <div className="h-px flex-1 bg-[#21262d]" />
      <span className="font-display font-700 uppercase tracking-[0.2em] text-sm text-[#e6edf3]">{title}</span>
      <div className="h-px flex-1 bg-[#21262d]" />
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-px bg-[#21262d] w-full overflow-hidden">
      <div
        className="h-full bg-[#39d353] transition-all duration-500 ease-out"
        style={{ width: `${value}%`, boxShadow: '0 0 8px rgba(57,211,83,0.6)' }}
      />
    </div>
  )
}

function LoadingState({ progress }: { progress: Progress | null }) {
  const stepIdx = STATUS_TO_STEP[progress?.step?.includes('fetch') ? 'fetching'
    : progress?.step?.includes('summar') || progress?.step === 'stack' ? 'analyzing'
    : progress?.step === 'complete' ? 'complete'
    : 'generating'] ?? 0

  const logs = [
    '> initializing repo-explainer v2.0',
    '> connecting to github api...',
    '> scanning repository tree...',
    progress?.message ?? '> processing...',
  ]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-up">
      {/* Progress bar */}
      <ProgressBar value={progress?.progress ?? 0} />

      {/* Step indicators */}
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`text-center py-2 border transition-all duration-300 ${
            i < stepIdx ? 'border-[#39d353]/50 text-[#39d353]'
            : i === stepIdx ? 'border-[#39d353] text-[#39d353] bg-[#39d353]/5'
            : 'border-[#21262d] text-[#484f58]'
          }`}>
            <div className="text-xs font-mono">{s.label}</div>
            {i < stepIdx && <div className="text-[10px] mt-0.5">✓ OK</div>}
            {i === stepIdx && <div className="text-[10px] mt-0.5 animate-blink">█</div>}
          </div>
        ))}
      </div>

      {/* Terminal log */}
      <div className="bg-[#0d1117] border border-[#21262d] rounded p-4 space-y-1">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#21262d]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f85149]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e3b341]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#39d353]" />
          <span className="text-[10px] text-[#484f58] ml-2 font-mono">repolens — analysis</span>
        </div>
        {logs.map((log, i) => (
          <TerminalLine key={i} dim={i < logs.length - 1} green={i === logs.length - 1}>
            {log}
            {i === logs.length - 1 && <span className="animate-blink">_</span>}
          </TerminalLine>
        ))}
      </div>
    </div>
  )
}

function StackSection({ stack }: { stack: StackInfo }) {
  return (
    <div className="space-y-3">
      {stack.languages.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-[#484f58] w-20 shrink-0">LANG</span>
          {stack.languages.map(l => <Badge key={l} label={l} color="text-[#58a6ff] border-[#58a6ff]/30 bg-[#58a6ff]/5" />)}
        </div>
      )}
      {stack.frameworks.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-[#484f58] w-20 shrink-0">FRAMEWORK</span>
          {stack.frameworks.map(f => <Badge key={f} label={f} color="text-[#bc8cff] border-[#bc8cff]/30 bg-[#bc8cff]/5" />)}
        </div>
      )}
      {stack.databases.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-[#484f58] w-20 shrink-0">DB</span>
          {stack.databases.map(d => <Badge key={d} label={d} color="text-[#39d353] border-[#39d353]/30 bg-[#39d353]/5" />)}
        </div>
      )}
      {stack.tools.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-[#484f58] w-20 shrink-0">TOOLS</span>
          {stack.tools.map(t => <Badge key={t} label={t} color="text-[#8b949e] border-[#484f58]/50 bg-[#161b22]" />)}
        </div>
      )}
      {stack.archPattern && (
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-[#484f58] w-20 shrink-0">PATTERN</span>
          <span className="text-xs text-[#8b949e]">{stack.archPattern}</span>
        </div>
      )}
    </div>
  )
}

function FileCard({ file }: { file: FileSummary }) {
  const [open, setOpen] = useState(false)
  const name = file.path.split('/').pop() ?? file.path
  const dir = file.path.includes('/') ? file.path.split('/').slice(0, -1).join('/') : ''

  return (
    <button
      onClick={() => setOpen(!open)}
      className={`w-full text-left border transition-all duration-200 ${
        open ? 'border-[#39d353]/40 bg-[#39d353]/3' : 'border-[#21262d] hover:border-[#39d353]/25 hover:bg-[#0d1117]'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className={`w-1 self-stretch rounded-full shrink-0 ${
          file.complexity === 'complex' ? 'bg-[#f85149]'
          : file.complexity === 'moderate' ? 'bg-[#e3b341]'
          : 'bg-[#39d353]'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-[#e6edf3] truncate">{name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] px-1.5 py-0.5 border rounded font-mono ${COMPLEXITY_COLOR[file.complexity]}`}>
                {file.complexity.toUpperCase()}
              </span>
              <span className="text-[10px] text-[#484f58]">{open ? '▲' : '▼'}</span>
            </div>
          </div>
          {dir && <div className="text-[10px] text-[#484f58] mt-0.5 font-mono truncate">{dir}/</div>}
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-[#21262d]">
          <p className="text-xs text-[#8b949e] mt-2 leading-relaxed">{file.purpose}</p>
          {file.keyExports.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {file.keyExports.map(e => (
                <code key={e} className="text-[10px] px-1.5 py-0.5 bg-[#0d1117] border border-[#21262d] text-[#39d353] rounded">{e}</code>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  )
}

type TabId = 'overview' | 'files' | 'diagram' | 'setup' | 'junior'

function ResultsView({ result }: { result: Result }) {
  const [tab, setTab] = useState<TabId>('overview')

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: '// OVERVIEW' },
    { id: 'files', label: '// FILES', count: result.fileSummaries.length },
    { id: 'diagram', label: '// DIAGRAM' },
    { id: 'setup', label: '// SETUP' },
    { id: 'junior', label: '// FOR JUNIORS' },
  ]

  return (
    <div className="animate-fade-up w-full max-w-6xl mx-auto">
      {/* Repo header */}
      <div className="border border-[#21262d] p-6 mb-6 bg-[#0d1117]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] text-[#484f58] font-mono border border-[#21262d] px-2 py-0.5">REPO</span>
              <h2 className="font-display font-800 text-2xl text-[#e6edf3]">
                {result.owner}/<span className="text-[#39d353]">{result.repoName}</span>
              </h2>
            </div>
            {result.description && (
              <p className="text-sm text-[#8b949e] mb-4 max-w-2xl">{result.description}</p>
            )}
            <StackSection stack={result.stack} />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#484f58] font-mono">ANALYZED</div>
            <div className="text-xs text-[#8b949e] font-mono mt-1">
              {new Date(result.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="mt-2 flex items-center gap-1.5 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-[#39d353]" style={{ animation: 'pulse-green 2s infinite' }} />
              <span className="text-[10px] text-[#39d353] font-mono">READY</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left nav */}
        <div className="space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-4 py-3 border text-xs font-mono transition-all ${
                tab === t.id
                  ? 'border-[#39d353] bg-[#39d353]/5 text-[#39d353]'
                  : 'border-[#21262d] text-[#484f58] hover:text-[#8b949e] hover:border-[#484f58]'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`ml-2 px-1.5 py-0.5 border text-[10px] rounded ${
                  tab === t.id ? 'border-[#39d353]/50 text-[#39d353]' : 'border-[#21262d] text-[#484f58]'
                }`}>{t.count}</span>
              )}
            </button>
          ))}

          {/* Mini file stats */}
          <div className="mt-4 border border-[#21262d] p-4 space-y-3">
            <div className="text-[10px] text-[#484f58] font-mono uppercase tracking-widest mb-2">COMPLEXITY</div>
            {(['simple', 'moderate', 'complex'] as const).map(c => {
              const count = result.fileSummaries.filter(f => f.complexity === c).length
              const pct = result.fileSummaries.length > 0 ? (count / result.fileSummaries.length) * 100 : 0
              return (
                <div key={c} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className={COMPLEXITY_COLOR[c].split(' ')[0]}>{c.toUpperCase()}</span>
                    <span className="text-[#484f58]">{count}</span>
                  </div>
                  <div className="h-px bg-[#21262d]">
                    <div
                      className={`h-full transition-all ${c === 'simple' ? 'bg-[#39d353]' : c === 'moderate' ? 'bg-[#e3b341]' : 'bg-[#f85149]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Content panel */}
        <div className="border border-[#21262d] bg-[#0d1117] min-h-[500px]">
          {/* Panel header */}
          <div className="border-b border-[#21262d] px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-[#484f58] font-mono">
              {TABS.find(t => t.id === tab)?.label}
            </span>
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-[#21262d]" />)}
            </div>
          </div>

          <div className="p-6">
            {tab === 'overview' && (
              <div
                className="text-sm leading-7 text-[#8b949e] space-y-1"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(result.architectureNarrative) }}
              />
            )}

            {tab === 'files' && (
              <div className="space-y-2">
                <p className="text-xs text-[#484f58] font-mono mb-4">
                  {result.fileSummaries.length} files analyzed — click to expand
                </p>
                {result.fileSummaries.map(f => <FileCard key={f.path} file={f} />)}
              </div>
            )}

            {tab === 'diagram' && (
              <div className="space-y-4">
                <p className="text-xs text-[#484f58] font-mono mb-4">
                  raw mermaid source — paste at mermaid.live to render
                </p>
                <div className="bg-[#080b0f] border border-[#21262d] rounded p-5 overflow-x-auto">
                  <pre className="text-xs font-mono text-[#39d353] leading-6 whitespace-pre-wrap">{result.mermaidDiagram}</pre>
                </div>
                <a
                  href={`https://mermaid.live/edit#base64:${btoa(result.mermaidDiagram)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#39d353]/50 text-[#39d353] text-xs font-mono hover:bg-[#39d353]/5 transition-colors"
                >
                  → OPEN IN MERMAID.LIVE
                </a>
              </div>
            )}

            {tab === 'setup' && (
              <div
                className="text-sm leading-7 text-[#8b949e] space-y-1"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(result.setupInstructions) }}
              />
            )}

            {tab === 'junior' && (
              <div>
                <div className="flex items-center gap-3 mb-6 p-3 border border-[#39d353]/30 bg-[#39d353]/5">
                  <span className="text-[#39d353] text-xs font-mono">⬡</span>
                  <span className="text-xs font-mono text-[#39d353]">EXPLAIN THIS CODEBASE TO A JUNIOR ENGINEER</span>
                </div>
                <div
                  className="text-sm leading-7 text-[#8b949e] space-y-1"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(result.juniorExplanation) }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isLoading = status === 'loading'

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function analyze(repoUrl: string) {
    if (!repoUrl.trim() || isLoading) return
    const fullUrl = repoUrl.startsWith('http') ? repoUrl : `https://github.com/${repoUrl}`
    setStatus('loading')
    setResult(null)
    setError(null)
    setProgress(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, token: token.trim() || undefined }),
      })

      if (!res.ok) throw new Error('Analysis failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Streaming unsupported')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        let event = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) event = line.slice(7).trim()
          else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (event === 'progress') setProgress(data)
              else if (event === 'result') { setResult(data); setStatus('done') }
              else if (event === 'error') { setError(data.message); setStatus('error') }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    analyze(url)
  }

  return (
    <div className="min-h-screen bg-[#080b0f]">
      {/* Top border accent */}
      <div className="h-0.5 w-full bg-[#39d353]" style={{ boxShadow: '0 0 20px rgba(57,211,83,0.5)' }} />

      {/* Header */}
      <header className="border-b border-[#21262d] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="border border-[#39d353]/50 px-2 py-1">
              <span className="font-display font-800 text-[#39d353] text-sm tracking-[0.15em]">REPO</span>
              <span className="font-display font-800 text-[#e6edf3] text-sm tracking-[0.15em]">LENS</span>
            </div>
            <span className="text-[#484f58] text-xs font-mono hidden sm:block">// AI-powered codebase explainer</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-[#484f58]">
            <span>GEMINI 2.0 FLASH</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#39d353]" style={{ animation: 'pulse-green 2s infinite' }} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero — always visible */}
        <div className="mb-16">
          {status === 'idle' || status === 'error' ? (
            <div className="space-y-10 animate-fade-up">
              {/* Big headline */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono text-[#484f58] tracking-[0.3em] uppercase">
                  v2.0 — understand any codebase
                </div>
                <h1 className="font-display font-800 text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] text-[#e6edf3]">
                  PASTE A REPO.<br />
                  <span className="text-[#39d353]">UNDERSTAND</span><br />
                  EVERYTHING.
                </h1>
                <p className="text-sm text-[#8b949e] font-mono max-w-lg mt-4 leading-relaxed">
                  Architecture diagrams. File-by-file explanations. Setup instructions.
                  A junior engineer guide. Powered by Gemini.
                </p>
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="space-y-3 max-w-2xl">
                <div className="flex border border-[#21262d] focus-within:border-[#39d353] transition-colors bg-[#0d1117]">
                  <span className="px-4 py-4 text-[#39d353] font-mono text-sm border-r border-[#21262d] select-none">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="github.com/owner/repo"
                    className="flex-1 px-4 py-4 bg-transparent text-[#e6edf3] font-mono text-sm placeholder:text-[#484f58] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!url.trim() || isLoading}
                    className="px-6 py-4 bg-[#39d353] text-[#080b0f] font-display font-700 text-sm tracking-wide hover:bg-[#46e360] disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase"
                  >
                    RUN →
                  </button>
                </div>

                {/* Token toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[10px] font-mono text-[#484f58] hover:text-[#8b949e] transition-colors"
                  >
                    {showToken ? '▼' : '▶'} github token (private repos / higher rate limits)
                  </button>
                  {showToken && (
                    <input
                      type="password"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="ghp_..."
                      className="mt-2 w-full px-4 py-3 bg-[#0d1117] border border-[#21262d] text-[#8b949e] font-mono text-xs focus:outline-none focus:border-[#39d353] transition-colors"
                    />
                  )}
                </div>
              </form>

              {/* Examples */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-mono text-[#484f58]">TRY →</span>
                {EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => { setUrl(ex); analyze(ex) }}
                    className="text-xs font-mono px-3 py-1.5 border border-[#21262d] text-[#484f58] hover:border-[#39d353]/40 hover:text-[#8b949e] transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
                {[
                  { num: '01', label: 'ARCHITECTURE', sub: 'Mermaid diagrams of component structure' },
                  { num: '02', label: 'FILE MAP', sub: 'Plain-English purpose for every file' },
                  { num: '03', label: 'SETUP GUIDE', sub: 'Step-by-step instructions with context' },
                  { num: '04', label: 'JUNIOR MODE', sub: '"Explain this codebase to a junior dev"' },
                ].map(f => (
                  <div key={f.num} className="border border-[#21262d] p-4 hover:border-[#39d353]/30 transition-colors group">
                    <div className="text-[10px] font-mono text-[#484f58] mb-2 group-hover:text-[#39d353] transition-colors">{f.num}</div>
                    <div className="font-display font-700 text-sm text-[#e6edf3] mb-1 tracking-wide">{f.label}</div>
                    <div className="text-[11px] text-[#484f58] leading-relaxed">{f.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Error */}
          {error && (
            <div className="mt-6 border border-[#f85149]/50 bg-[#f85149]/5 p-4 flex gap-3 items-start max-w-2xl">
              <span className="text-[#f85149] font-mono text-sm shrink-0">ERR</span>
              <div>
                <p className="text-xs font-mono text-[#f85149]">Analysis failed</p>
                <p className="text-xs text-[#8b949e] mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && <LoadingState progress={progress} />}

        {/* Results */}
        {status === 'done' && result && (
          <div className="space-y-8">
            {/* New analysis input at top */}
            <form onSubmit={handleSubmit} className="flex border border-[#21262d] focus-within:border-[#39d353] transition-colors bg-[#0d1117] max-w-2xl">
              <span className="px-4 py-3 text-[#39d353] font-mono text-sm border-r border-[#21262d] select-none">$</span>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="analyze another repo..."
                className="flex-1 px-4 py-3 bg-transparent text-[#e6edf3] font-mono text-sm placeholder:text-[#484f58] focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-3 border-l border-[#21262d] text-[#39d353] font-mono text-xs hover:bg-[#39d353]/5 transition-colors"
              >
                RUN →
              </button>
            </form>
            <ResultsView result={result} />
          </div>
        )}
      </main>

      <footer className="border-t border-[#21262d] px-6 py-6 mt-24">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="font-mono text-[10px] text-[#484f58]">REPOLENS // BUILT WITH NEXT.JS + GEMINI</span>
          <span className="font-mono text-[10px] text-[#484f58]">2026</span>
        </div>
      </footer>
    </div>
  )
}
