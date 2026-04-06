import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 my-3">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(suggestion)}
          className="liquid-glass rounded-full px-4 py-2 text-sm text-on-surface hover:bg-white/[0.08] transition-all active:scale-95"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
