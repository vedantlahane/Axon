// ─── Schema Card ─────────────────────────────────────────────────────────────
// Expandable database schema viewer.
// Matches FRONTEND_CONTEXT.md §5.3 "SchemaCard"

import React, { useState } from 'react';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: boolean;
  unique?: boolean;
  autoIncrement?: boolean;
  hasDefault?: boolean;
}

interface Table {
  name: string;
  rowCount?: number;
  columns: Column[];
}

interface SchemaCardProps {
  databaseName?: string;
  tables: Table[];
  onQueryTable?: (tableName: string) => void;
  onShowERD?: () => void;
  onExport?: () => void;
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  PK:       { bg: 'rgba(124, 58, 237, 0.10)', color: '#a78bfa', border: 'rgba(124, 58, 237, 0.20)' },
  FK:       { bg: 'rgba(52, 211, 153, 0.10)', color: '#34D399', border: 'rgba(52, 211, 153, 0.20)' },
  UNIQUE:   { bg: 'rgba(96, 165, 250, 0.10)', color: '#60A5FA', border: 'rgba(96, 165, 250, 0.20)' },
  'NOT NULL': { bg: 'rgba(148, 163, 184, 0.10)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.20)' },
  AUTO:     { bg: 'rgba(148, 163, 184, 0.10)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.20)' },
  DEFAULT:  { bg: 'rgba(148, 163, 184, 0.10)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.20)' },
};

const ConstraintBadge: React.FC<{ label: string }> = ({ label }) => {
  const style = BADGE_STYLES[label] ?? BADGE_STYLES['NOT NULL'];
  return (
    <span
      className="text-[9px] uppercase px-1.5 py-0.5 rounded font-medium"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {label}
    </span>
  );
};

const SchemaCard: React.FC<SchemaCardProps> = ({
  databaseName = 'database',
  tables,
  onQueryTable,
  onShowERD,
  onExport,
}) => {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  return (
    <div
      className="liquid-glass rounded-xl overflow-hidden mb-4"
      style={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <span
          className="text-[10px] uppercase tracking-widest font-medium"
          style={{ color: 'rgba(196, 199, 201, 0.6)' }}
        >
          Database Schema · {databaseName} · {tables.length} table
          {tables.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tables ──────────────────────────────────────────────────── */}
      <div className="divide-y divide-white/[0.03]">
        {tables.map((table) => {
          const isExpanded = expandedTable === table.name;

          return (
            <div key={table.name}>
              {/* Table row */}
              <button
                type="button"
                className="w-full flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-left"
                onClick={() =>
                  setExpandedTable(isExpanded ? null : table.name)
                }
              >
                <span
                  className="material-symbols-outlined text-sm transition-transform"
                  style={{
                    color: 'var(--text-ghost)',
                    fontSize: '18px',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  chevron_right
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', color: 'var(--text-secondary)' }}
                >
                  table_chart
                </span>
                <span className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>
                  {table.name}
                </span>
                {table.rowCount != null && (
                  <span className="text-xs text-slate-500 ml-auto">
                    {table.rowCount.toLocaleString()} rows ·{' '}
                    {table.columns.length} col
                  </span>
                )}
              </button>

              {/* Expanded columns */}
              {isExpanded && (
                <div
                  className="mx-6 mb-4 rounded-lg overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  {table.columns.map((col) => {
                    const badges: string[] = [];
                    if (col.primaryKey) badges.push('PK');
                    if (col.foreignKey) badges.push('FK');
                    if (col.unique) badges.push('UNIQUE');
                    if (!col.nullable) badges.push('NOT NULL');
                    if (col.autoIncrement) badges.push('AUTO');
                    if (col.hasDefault) badges.push('DEFAULT');

                    return (
                      <div
                        key={col.name}
                        className="flex items-center justify-between px-4 py-2 text-xs"
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-300">
                            {col.name}
                          </span>
                          <span className="text-slate-500 uppercase">
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
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      {(onQueryTable || onShowERD || onExport) && (
        <div
          className="flex items-center justify-end gap-3 px-6 py-3"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {onQueryTable && (
            <button
              type="button"
              className="btn-glass text-xs"
              style={{ color: 'var(--accent-violet-light)' }}
              onClick={() => onQueryTable(expandedTable ?? tables[0]?.name)}
            >
              Query This
            </button>
          )}
          {onShowERD && (
            <button
              type="button"
              className="btn-glass text-xs"
              onClick={onShowERD}
            >
              Show ERD
            </button>
          )}
          {onExport && (
            <button
              type="button"
              className="btn-glass text-xs"
              onClick={onExport}
            >
              Export
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SchemaCard;