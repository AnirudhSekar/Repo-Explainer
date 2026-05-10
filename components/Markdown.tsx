import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-invert prose-stone max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-stone-100 mb-4 mt-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-stone-100 mb-3 mt-6 first:mt-0 border-b border-stone-800 pb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-stone-200 mb-2 mt-4">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-stone-300 leading-relaxed mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 mb-4 text-stone-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 mb-4 text-stone-300 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex gap-2 text-stone-300">
              <span className="text-amber-500 mt-1.5 shrink-0">▸</span>
              <span>{children}</span>
            </li>
          ),
          code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; className?: string }) =>
            inline ? (
              <code className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className="block" {...props}>{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="bg-stone-950 border border-stone-800 rounded-xl p-4 overflow-x-auto mb-4 text-sm font-mono text-stone-300">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-500 pl-4 my-4 text-stone-400 italic">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-stone-100">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
              {children}
            </a>
          ),
          hr: () => <hr className="border-stone-800 my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
