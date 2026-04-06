// ─── Schema Viewer ───────────────────────────────────────────────────────────
// Expandable database schema browser with constraint badges.

import React, { useMemo, useState } from 'react';
import type { SqlSchemaPayload } from '../../types/database';

interface SchemaViewerProps {
  schema: SqlSchemaPayload | null;
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  PK:         { bg: 'rgba(124, 58, 237, 0.10)', color: '#a78bfa', border: 'rgba(124, 58, 237, 0.20)' },
  FK:         { bg: 'rgba(52, 211, 153, 0.10)', color: '#34D399', border: 'rgba(52, 211, 153, 0.20)' },
  UNIQUE:     { bg: 'rgba(96, 165, 250, 0.10)', color: '#60A5FA', border: 'rgba(96, 165, 250, 0.20)' },
  'NOT NULL': { bg: 'rgba(148, 163, 184, 0.10)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.20)' },
  NULL:       { bg: 'rgba(148, 163, 184, 0.06)', color: '#64748B', border: 'rgba(148, 163, 184, 0.15)' },
};

const ConstraintBadge: React.FC<{ label: string }> = ({ label }) => {
  const s = BADGE_STYLES[label] ?? BADGE_STYLES['NOT NULL'];
  return (
    <span
      className="text-[9px] uppercase px-1.5 py-0.5 rounded font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  );
};

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const tables = useMemo(() => schema?.tables ?? [], [schema]);
  const views = useMemo(() => schema?.views ?? [], [schema]);
  const hasSchema = tables.length > 0 || views.length > 0;
  const connectionLabel = schema?.connection?.label ?? 'No connection';

  if (!schema) {
    return (
      <div className="liquid-glass rounded-xl p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        No schema information available.
      </div>
    );
  }

  if (!hasSchema) {
    return (
      <div className="liquid-glass rounded-xl p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        Schema loaded, but there are no tables or views to display.
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-xl overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: 'var(--text-faint)' }}
          >
            Schema Browser
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {connectionLabel}
          </p>
        </div>
        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{tables.length} tables</span>
          <span>{views.length} views</span>
        </div>
      </div>

      {/* ── Tables ────────────────────────────────────────────────────── */}
      <div className="divide-y divide-white/[0.03]">
        {tables.map((table) => {
          const isExpanded = expandedTable === table.name;
          return (
            <div key={table.name}>
              <button
                type="button"
                onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <span
                  className="material-symbols-outlined text-sm transition-transform shrink-0"
                  style={{
                    color: 'var(--text-ghost)',
                    fontSize: '18px',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  chevron_right
                </span>
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ fontSize: '16px', color: 'var(--text-secondary)' }}
                >
                  table_chart
                </span>
                <span className="text-sm font-medium text-white">{table.name}</span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                  {table.columns.length} columns
                </span>
              </button>

              {isExpanded && (
                <div className="mx-5 mb-4 space-y-3">
                  {/* Columns */}
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                  >
                    {table.columns.map((col) => {
                      const badges: string[] = [];
                      if (col.primaryKey) badges.push('PK');
                      if (!col.nullable) badges.push('NOT NULL');
                      else badges.push('NULL');

                      return (
                        <div
                          key={col.name}
                          className="flex items-center justify-between px-4 py-2 text-xs"
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-300">{col.name}</span>
                            <span
                              className="uppercase"
                              style={{ color: 'var(--text-muted)', fontSize: '10px' }}
                            >
                              {col.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {badges.map((b) => (
                              <ConstraintBadge key={b} label={b} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Foreign Keys */}
                  {table.foreignKeys?.length ? (
                    <div
                      className="rounded-lg p-3 text-sm"
                      style={{
                        background: 'rgba(52, 211, 153, 0.04)',
                        border: '1px solid rgba(52, 211, 153, 0.10)',
                      }}
                    >
                      <p
                        className="mb-2 text-[10px] uppercase tracking-[0.15em] font-medium"
                        style={{ color: '#34D399' }}
                      >
                        Foreign Keys
                      </p>
                      <ul className="space-y-1.5">
                        {table.foreignKeys.map((fk, idx) => (
                          <li
                            key={`${table.name}-fk-${idx}`}
                            className="flex items-center gap-2 text-xs"
                          >
                            <ConstraintBadge label="FK" />
                            <span className="font-mono text-slate-300">{fk.column}</span>
                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                            <span className="font-mono" style={{ color: '#34D399' }}>
                              {fk.referencedTable}.{fk.referencedColumn}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Views ─────────────────────────────────────────────────────── */}
      {views.length > 0 && (
        <div
          className="px-5 py-4"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-medium mb-3"
            style={{ color: 'var(--text-faint)' }}
          >
            Views
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {views.map((view) => (
              <div
                key={view.name}
                className="rounded-lg px-3 py-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <p className="text-sm text-white">{view.name}</p>
                <p
                  className="text-[10px] uppercase tracking-widest mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {view.columns.length} columns
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaViewer;