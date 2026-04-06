import React, { useMemo, useState } from 'react';
import type { SqlSchemaPayload } from '../../types/database';

interface SchemaViewerProps {
  schema: SqlSchemaPayload | null;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const hasSchema = Boolean(schema?.tables?.length || schema?.views?.length);

  const tableCount = schema?.tables.length ?? 0;
  const viewCount = schema?.views.length ?? 0;

  const connectionLabel = schema?.connection?.label ?? 'No connection';

  const formattedTables = useMemo(() => schema?.tables ?? [], [schema]);
  const formattedViews = useMemo(() => schema?.views ?? [], [schema]);

  if (!schema) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-sm text-white/70">
        <p>No schema information is available.</p>
      </div>
    );
  }

  if (!hasSchema) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-sm text-white/70">
        <p>Schema loaded, but there are no tables or views to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-white shadow-[0_20px_80px_-40px_rgba(15,23,42,0.8)]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Schema browser</p>
          <p className="mt-2 text-sm text-slate-200">{connectionLabel}</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-400">
          <span>{tableCount} tables</span>
          <span>{viewCount} views</span>
        </div>
      </div>

      <div className="space-y-4">
        {formattedTables.map((table) => {
          const isExpanded = expandedTable === table.name;
          return (
            <div key={table.name} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <button
                type="button"
                onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{table.name}</p>
                  <p className="text-xs text-slate-400">{table.columns.length} columns</p>
                </div>
                <span className="text-slate-400">{isExpanded ? '▾' : '▸'}</span>
              </button>
              {isExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {table.columns.map((column) => (
                      <div key={column.name} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-slate-100">{column.name}</p>
                          <span className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[11px] text-slate-300">{column.primaryKey ? 'PK' : column.nullable ? 'NULL' : 'NOT NULL'}</span>
                        </div>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{column.type}</p>
                      </div>
                    ))}
                  </div>
                  {table.foreignKeys?.length ? (
                    <div className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-3 text-sm text-slate-200">
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-violet-300">Foreign keys</p>
                      <ul className="space-y-2">
                        {table.foreignKeys.map((fk, idx) => (
                          <li key={`${table.name}-fk-${idx}`} className="flex flex-col gap-1 rounded-2xl bg-slate-950/80 p-3">
                            <span className="text-sm text-white">{fk.column}</span>
                            <span className="text-xs text-slate-400">references {fk.referencedTable}.{fk.referencedColumn}</span>
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
        {formattedViews.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
            <p className="text-sm font-semibold text-white">Views</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {formattedViews.map((view) => (
                <div key={view.name} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-sm text-slate-100">{view.name}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{view.columns.length} columns</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaViewer;
