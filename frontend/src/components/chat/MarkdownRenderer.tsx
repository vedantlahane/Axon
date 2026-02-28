import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Theme-aware Markdown renderer powered by react-markdown + remark-gfm.
 * Replaces the hand-rolled parseFormattedContent parser with full GFM support
 * including tables, strikethrough, task lists, autolinks, etc.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const mdComponents: Components = useMemo(() => ({
    // Headings
    h1: ({ children }) => (
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mt-4 mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-base font-semibold text-[var(--text-primary)] mt-3 mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-3 mb-1">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-sm font-medium text-[var(--text-secondary)] mt-2 mb-1">{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-xs font-medium text-[var(--text-muted)] mt-2 mb-1">{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-xs font-medium text-[var(--text-subtle)] mt-2 mb-1">{children}</h6>
    ),

    // Paragraphs
    p: ({ children }) => (
      <p className="my-1.5 text-[var(--text-secondary)] leading-relaxed">{children}</p>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc space-y-1 pl-5 my-2 text-[var(--text-secondary)]">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal space-y-1 pl-5 my-2 text-[var(--text-secondary)]">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-[var(--text-secondary)] leading-relaxed">{children}</li>
    ),

    // Inline elements
    strong: ({ children }) => (
      <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-[var(--text-secondary)]">{children}</em>
    ),
    del: ({ children }) => (
      <del className="line-through text-[var(--text-subtle)]">{children}</del>
    ),

    // Inline code
    code: ({ children, className }) => {
      const isBlock = className?.includes('language-');
      if (isBlock) {
        return <code className={className}>{children}</code>;
      }
      return (
        <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--accent)]">
          {children}
        </code>
      );
    },

    // Code blocks
    pre: ({ children }) => {
      // Extract language from child <code> className
      const codeChild = React.Children.toArray(children).find(
        (child): child is React.ReactElement<{ className?: string; children?: React.ReactNode }> =>
          React.isValidElement(child) && child.type === 'code'
      );
      const className = codeChild?.props?.className || '';
      const langMatch = className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1].toUpperCase() : 'CODE';
      const codeContent =
        typeof codeChild?.props?.children === 'string'
          ? codeChild.props.children
          : '';

      return (
        <div className="my-3 rounded-xl border border-[var(--border)] bg-slate-50 dark:bg-[#0b1220]/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-soft)]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
              {lang}
            </span>
            {codeContent && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="text-[10px] text-[var(--text-subtle)] hover:text-[var(--text-secondary)] transition"
              >
                Copy
              </button>
            )}
          </div>
          <pre className="p-4 text-sm font-mono text-slate-700 dark:text-sky-200/90 overflow-x-auto leading-relaxed">
            {children}
          </pre>
        </div>
      );
    },

    // Block quotes
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-2 border-[var(--accent)]/40 pl-3 italic text-[var(--text-muted)]">
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: () => <hr className="my-4 border-[var(--border)]" />,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent)]/80 transition"
      >
        {children}
      </a>
    ),

    // Tables (GFM)
    table: ({ children }) => (
      <div className="my-3 rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-[var(--border)] bg-[var(--bg-soft)]">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-[var(--bg-soft)]/50">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-[var(--text-secondary)] font-mono text-xs">{children}</td>
    ),

    // Images
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt || ''}
        className="my-2 max-w-full rounded-lg border border-[var(--border)]"
        loading="lazy"
      />
    ),

    // Task list items (GFM)
    input: ({ checked, ...props }) => (
      <input
        {...props}
        checked={checked}
        disabled
        className="mr-2 rounded border-[var(--border)] accent-[var(--accent)]"
      />
    ),
  }), []);

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
