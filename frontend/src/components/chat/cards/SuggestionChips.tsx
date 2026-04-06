// cards/SuggestionChips.tsx — updated hover
import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSelect,
}) => (
  <div className="flex flex-wrap gap-2 my-3">
    {suggestions.map((suggestion, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => onSelect(suggestion)}
        className="liquid-glass rounded-full px-4 py-2 text-sm hover:bg-white/10 transition-all active:scale-[0.98]"
        style={{ color: 'var(--on-surface)' }}
      >
        {suggestion}
      </button>
    ))}
  </div>
);

export default SuggestionChips;