import React from 'react';

interface EmptyStateProps {
  onSuggestClick?: (suggestion: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onSuggestClick }) => {
  const suggestions = [
    { title: 'Analyze trends', description: 'Examine data patterns' },
    { title: 'Generate report', description: 'Create comprehensive summary' },
    { title: 'Compare metrics', description: 'Analyze key statistics' },
    { title: 'Export analysis', description: 'Download results' },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute ambient-orb-1" />
      <div className="absolute ambient-orb-2" />
      <div className="ai-pulse" />

      {/* Center content */}
      <div className="relative z-10 text-center max-w-2xl px-4">
        {/* Icon with pulse */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent rounded-full blur-3xl" />
            <span className="relative material-symbols-outlined text-7xl text-violet-400">
              auto_awesome
            </span>
          </div>
        </div>

        {/* Main text */}
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
          Ask anything.
          <br />
          Upload anything.
        </h1>

        <p className="text-on-surface-variant text-lg mb-12">
          Get insights from your data instantly with AI-powered analysis.
        </p>

        {/* Suggestion grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestClick?.(suggestion.title)}
              className="group liquid-glass rounded-lg p-4 text-left hover:bg-white/[0.08] transition-all active:scale-95"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-violet-400 mt-1">
                  {idx === 0 && 'trending_up'}
                  {idx === 1 && 'description'}
                  {idx === 2 && 'compare_arrows'}
                  {idx === 3 && 'cloud_download'}
                </span>
                <div>
                  <p className="font-semibold text-on-surface group-hover:text-white transition-colors">
                    {suggestion.title}
                  </p>
                  <p className="text-sm text-on-surface-variant">{suggestion.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-sm text-on-surface-variant mt-12">
          💡 Tip: Use <span className="font-mono bg-surface-container px-1.5 py-0.5">⌘K</span> to search or run commands
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
