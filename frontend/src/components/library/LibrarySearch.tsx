// ─── Library Search ──────────────────────────────────────────────────────────
// Search + filter chips for the Library page.

import React from 'react';
import Icon from '../ui/Icon';

interface LibrarySearchProps {
  query: string;
  onSearch: (query: string) => void;
  activeFilter: string;
  onFilter: (filter: string) => void;
}

const FILTERS = ['All', 'Today', 'This Week', 'This Month', 'Pinned'];

const LibrarySearch: React.FC<LibrarySearchProps> = ({
  query,
  onSearch,
  activeFilter,
  onFilter,
}) => (
  <div className="space-y-4 mb-6">
    {/* Search */}
    <div className="relative max-w-[280px]">
      <Icon
        name="search"
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-ghost)', fontSize: 18 }}
      />
      <input
        type="text"
        placeholder="Search conversations…"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        className="input-glass pl-10 rounded-full text-sm"
        aria-label="Search conversations"
      />
    </div>

    {/* Filter chips */}
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onFilter(filter)}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.98]"
          style={{
            background:
              activeFilter === filter
                ? 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))'
                : 'var(--glass-bg, rgba(255, 255, 255, 0.05))',
            color:
              activeFilter === filter
                ? 'var(--accent-violet-light, #a78bfa)'
                : 'var(--text-secondary)',
            border: `1px solid ${
              activeFilter === filter
                ? 'rgba(124, 58, 237, 0.25)'
                : 'var(--glass-border, rgba(255, 255, 255, 0.06))'
            }`,
          }}
        >
          {filter}
        </button>
      ))}
    </div>
  </div>
);

export default LibrarySearch;