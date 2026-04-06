import React from "react";
import type { SqlQuerySuggestion } from "../../types/database";

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
}) => {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        {suggestionAnalysis && (
          <span className="text-[10px] text-[var(--text-subtle)]">Updated just now</span>
        )}
      </header>
      {suggestionAnalysis && (
        <p className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-200">
          {suggestionAnalysis}
        </p>
      )}
      {suggestionsError && (
        <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-200">
          {suggestionsError}
        </div>
      )}
      {suggestions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-subtle)]">
          Request suggestions to see AI-assisted improvements.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-muted)] shadow-inner"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                  {suggestion.title}
                </h3>
                <button
                  type="button"
                  onClick={() => onSelectSuggestion(suggestion)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
                >
                  Load query
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{suggestion.summary}</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3 font-mono text-[11px] text-[var(--text-secondary)]">
                {suggestion.query}
              </pre>
              {suggestion.rationale && (
                <p className="mt-2 text-[11px] text-blue-700/80 dark:text-blue-200/80">{suggestion.rationale}</p>
              )}
              {suggestion.warnings?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-amber-700/90 dark:text-amber-200/80">
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
};
