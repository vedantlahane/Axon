import React from 'react';

interface LibrarySearchProps {
  query: string;
  onSearch: (query: string) => void;
  activeFilter: string;
  onFilter: (filter: string) => void;
}

const LibrarySearch: React.FC<LibrarySearchProps> = ({ query, onSearch, activeFilter, onFilter }) => {
  const filters = ['All', 'Today', 'This Week', 'This Month', 'Pinned'];

  return (
    <div className="space-y-4 mb-6">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">
          search
        </span>
        <input
          type="text"
          placeholder="Search conversations..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilter(filter)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              activeFilter === filter
                ? 'bg-violet-500 text-white'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LibrarySearch;
