// ─── SQL Suggestions Panel ───────────────────────────────────────────────────

import React from 'react';
import type { SqlQuerySuggestion } from '../../types/database';

interface SqlSuggestionsPanelProps {
  suggestions: SqlQuerySuggestion[];
  suggestionAnalysis: string | null;
  suggestionsError: string | null;
  onSelectSuggestion: (suggestion: SqlQuerySuggestion) => void;
}

export const SqlSuggestionsPanel: React.FC<SqlSuggestionsPanelProps> = ({
  suggestions,
  suggestionAnalysis,
  suggestionsError,
  onSelectSuggestion,
}) => (
  <section className="flex flex-col gap-3">
    <header className="flex items-center justify-between">
      {suggestionAnalysis && (
        <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
          Updated just now
        </span>
      )}
    </header>

    {/* Analysis note */}
    {suggestionAnalysis && (
      <div className="glass-info rounded-xl p-3 text-xs" style={{ color: 'var(--color-info)' }}>
        {suggestionAnalysis}
      </div>
    )}

    {/* Error */}
    {suggestionsError && (
      <div className="glass-error rounded-lg p-3 text-xs" style={{ color: 'var(--color-error)' }}>
        {suggestionsError}
      </div>
    )}

    {/* Empty */}
    {suggestions.length === 0 ? (
      <div
        className="rounded-xl p-4 text-sm text-center"
        style={{
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          color: 'var(--text-muted)',
        }}
      >
        Request suggestions to see AI-assisted improvements.
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-xl p-3 text-sm"
            style={{
              background: 'var(--glass-bg, rgba(255, 255, 255, 0.05))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.06))',
            }}
          >
            {/* Title + action */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3
                className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: 'var(--text-faint)' }}
              >
                {suggestion.title}
              </h3>
              <button
                type="button"
                onClick={() => onSelectSuggestion(suggestion)}
                className="btn-glass text-[10px] px-2 py-1"
              >
                Load query
              </button>
            </div>

            {/* Summary */}
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {suggestion.summary}
            </p>

            {/* Query preview */}
            <pre
              className="mt-2 overflow-x-auto rounded-lg p-3 font-mono text-[11px]"
              style={{
                background: 'var(--bg-surface-lowest, #060e20)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
              }}
            >
              {suggestion.query}
            </pre>

            {/* Rationale */}
            {suggestion.rationale && (
              <p className="mt-2 text-[11px]" style={{ color: 'var(--color-info)' }}>
                {suggestion.rationale}
              </p>
            )}

            {/* Warnings */}
            {suggestion.warnings?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px]" style={{ color: 'var(--color-warning)' }}>
                {suggestion.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    )}
  </section>
);