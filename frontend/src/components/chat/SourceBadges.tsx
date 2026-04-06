// ─── Source Badges ────────────────────────────────────────────────────────────
// Shows source tags (e.g., "SQL", "Document", "Schema") under AI messages.

import React from 'react';

interface SourceBadgesProps {
  sources: string[];
}

const SourceBadges: React.FC<SourceBadgesProps> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {sources.map((s) => (
        <span
          key={s}
          className="badge badge-violet"
        >
          {s}
        </span>
      ))}
    </div>
  );
};

export default SourceBadges;