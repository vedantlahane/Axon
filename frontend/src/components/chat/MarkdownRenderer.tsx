// ─── Markdown Renderer ───────────────────────────────────────────────────────
// Theme-aware Markdown renderer using react-markdown + remark-gfm.
// All CSS variables map to tokens.css.

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const mdComponents: Components = useMemo(
    () => ({
      // ── Headings ───────────────────────────────────────────────────────
      h1: ({ children }) => (
        <h1 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-base font-semibold mt-3 mb-2" style={{ color: 'var(--text-primary)' }}>
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-sm font-semibold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="text-sm font-medium mt-2 mb-1" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </h4>
      ),
      h5: ({ children }) => (
        <h5 className="text-xs font-medium mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>
          {children}
        </h5>
      ),
      h6: ({ children }) => (
        <h6 className="text-xs font-medium mt-2 mb-1" style={{ color: 'var(--text-subtle)' }}>
          {children}
        </h6>
      ),

      // ── Body ───────────────────────────────────────────────────────────
      p: ({ children }) => (
        <p className="my-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </p>
      ),

      // ── Lists ──────────────────────────────────────────────────────────
      ul: ({ children }) => (
        <ul className="list-disc space-y-1 pl-5 my-2" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal space-y-1 pl-5 my-2" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </li>
      ),

      // ── Inline ─────────────────────────────────────────────────────────
      strong: ({ children }) => (
        <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {children}
        </strong>
      ),
      em: ({ children }) => (
        <em className="italic" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </em>
      ),
      del: ({ children }) => (
        <del className="line-through" style={{ color: 'var(--text-subtle)' }}>
          {children}
        </del>
      ),

      // ── Inline Code ────────────────────────────────────────────────────
      code: ({ children, className }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) return <code className={className}>{children}</code>;
        return (
          <code
            className="rounded px-1.5 py-0.5 font-mono text-[13px]"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--violet-bright, #a78bfa)',
            }}
          >
            {children}
          </code>
        );
      },

      // ── Code Blocks ────────────────────────────────────────────────────
      pre: ({ children }) => {
        const codeChild = React.Children.toArray(children).find(
          (child): child is React.ReactElement<{
            className?: string;
            children?: React.ReactNode;
          }> => React.isValidElement(child) && child.type === 'code'
        );
        const className = codeChild?.props?.className || '';
        const langMatch = className.match(/language-(\w+)/);
        const lang = langMatch ? langMatch[1].toUpperCase() : 'CODE';
        const codeContent =
          typeof codeChild?.props?.children === 'string'
            ? codeChild.props.children
            : '';

        return (
          <div
            className="my-3 rounded-xl overflow-hidden"
            style={{
              border: '1px solid var(--glass-border)',
              background: 'var(--surface-container-lowest, #060e20)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {lang}
              </span>
              {codeContent && (
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(codeContent)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Copy
                </button>
              )}
            </div>
            {/* Code */}
            <pre className="p-4 text-sm font-mono overflow-x-auto leading-relaxed" style={{ color: '#CBD5E1' }}>
              {children}
            </pre>
          </div>
        );
      },

      // ── Block Quote ────────────────────────────────────────────────────
      blockquote: ({ children }) => (
        <blockquote
          className="my-2 pl-3 italic"
          style={{
            borderLeft: '2px solid rgba(255, 255, 255, 0.10)',
            color: 'var(--text-muted)',
          }}
        >
          {children}
        </blockquote>
      ),

      // ── HR ─────────────────────────────────────────────────────────────
      hr: () => <div className="gradient-separator my-4" />,

      // ── Links ──────────────────────────────────────────────────────────
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors"
          style={{ color: 'var(--violet-bright, #a78bfa)' }}
        >
          {children}
        </a>
      ),

      // ── Tables ─────────────────────────────────────────────────────────
      table: ({ children }) => (
        <div
          className="my-3 rounded-lg overflow-x-auto"
          style={{ border: '1px solid var(--glass-border)' }}
        >
          <table className="w-full text-sm">{children}</table>
        </div>
      ),
      thead: ({ children }) => (
        <thead
          style={{
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          {children}
        </thead>
      ),
      tbody: ({ children }) => <tbody>{children}</tbody>,
      tr: ({ children }) => (
        <tr className="hover:bg-white/5 transition-colors">{children}</tr>
      ),
      th: ({ children }) => (
        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </td>
      ),

      // ── Images ─────────────────────────────────────────────────────────
      img: ({ src, alt }) => (
        <img
          src={src}
          alt={alt || ''}
          className="my-2 max-w-full rounded-lg"
          style={{ border: '1px solid var(--glass-border)' }}
          loading="lazy"
        />
      ),

      // ── Task Lists ─────────────────────────────────────────────────────
      input: ({ checked, ...props }) => (
        <input
          {...props}
          checked={checked}
          disabled
          className="mr-2 rounded accent-violet-500"
        />
      ),
    }),
    []
  );

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;