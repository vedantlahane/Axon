// ─── Document Preview ────────────────────────────────────────────────────────
// Inline document summary card.
// Matches FRONTEND_CONTEXT.md §5.3 "DocumentPreview"

import React from 'react';
import Icon from '../../ui/Icon';
import { formatFileSize } from '../../../utils/formatters';

interface DocumentPreviewProps {
  filename: string;
  summary: string[];
  fileSize?: number;
  onView?: () => void;
  onDownload?: () => void;
  onAsk?: () => void;
}

const FILE_COLORS: Record<string, string> = {
  pdf: 'text-rose-400',
  xlsx: 'text-emerald-400',
  csv: 'text-emerald-400',
  sql: 'text-blue-400',
  default: 'text-violet-400',
};

const FILE_ICONS: Record<string, string> = {
  pdf: 'description',
  xlsx: 'table_chart',
  csv: 'table_chart',
  sql: 'database',
  default: 'file_present',
};

const getExt = (name: string) =>
  name.split('.').pop()?.toLowerCase() ?? '';

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  filename,
  summary,
  fileSize,
  onView,
  onDownload,
  onAsk,
}) => {
  const ext = getExt(filename);
  const iconColor = FILE_COLORS[ext] ?? FILE_COLORS.default;
  const icon = FILE_ICONS[ext] ?? FILE_ICONS.default;

  return (
    <div
      className="liquid-glass rounded-xl overflow-hidden mb-4 hover:bg-white/10 transition-colors"
      style={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Icon
          name={icon}
          className={iconColor}
          style={{ fontSize: 18 }}
        />
        <span className="text-sm font-medium text-slate-200">{filename}</span>
        {fileSize && (
          <span className="text-xs text-slate-500 ml-1">
            — {formatFileSize(fileSize)}
          </span>
        )}
        <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-auto">
          Summary
        </span>
      </div>

      {/* ── Body — Bullet List ──────────────────────────────────────── */}
      <div className="px-6 py-4">
        <ul className="space-y-1.5">
          {summary.map((bullet, idx) => (
            <li
              key={idx}
              className="text-sm text-slate-300 leading-relaxed flex gap-2"
            >
              <span className="text-violet-400 shrink-0">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      {(onView || onDownload || onAsk) && (
        <div
          className="flex items-center justify-end gap-3 px-6 py-3"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {onView && (
            <button
              type="button"
              className="btn-glass text-xs"
              onClick={onView}
            >
              View Full
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              className="btn-glass text-xs"
              onClick={onDownload}
            >
              Download
            </button>
          )}
          {onAsk && (
            <button
              type="button"
              className="btn-glass text-xs"
              style={{ color: 'var(--accent-violet-light)' }}
              onClick={onAsk}
            >
              Ask More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;