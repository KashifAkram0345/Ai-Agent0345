"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ language, text }: { language: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div className="code-toolbar"><span>{language}</span><button onClick={() => { void navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>{copied ? "Copied" : "Copy"}</button></div>
      <pre><code className="text-slate-300">{text}</code></pre>
    </>
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose-agent text-[0.95rem] leading-7 text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <div className="code-wrap">{children}</div>;
          },
          code({ className, children, ...props }) {
            const text = String(children).replace(/\n$/, "");
            const language = className?.replace("language-", "") || "code";
            const isBlock = Boolean(className);
            if (!isBlock) return <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-violet-200" {...props}>{children}</code>;
            return <CodeBlock language={language} text={text} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}