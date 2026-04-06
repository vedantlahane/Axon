// ─── Empty State ─────────────────────────────────────────────────────────────
// Hero state when no messages exist.
// Matches FRONTEND_CONTEXT.md §5.2 "EmptyState"

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';
import { fadeUp, staggerContainer } from '../../lib/animations';

interface EmptyStateProps {
  onSuggestClick?: (suggestion: string) => void;
}

const suggestions = [
  { icon: 'terminal',    text: 'Optimize SQL' },
  { icon: 'description', text: 'Analyze a document' },
  { icon: 'database',    text: 'Explore schema' },
  { icon: 'code',        text: 'Write Python' },
];

const EmptyState: React.FC<EmptyStateProps> = ({ onSuggestClick }) => (
  <motion.div
    className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6"
    initial="initial"
    animate="animate"
    variants={staggerContainer}
  >
    {/* ── Icon with AI pulse ──────────────────────────────────────────── */}
    <motion.div className="relative mb-10" variants={fadeUp}>
      {/* Glow behind icon */}
      <div
        className="absolute inset-0 rounded-full -z-10 pulse-glow"
        style={{
          background: 'rgba(224, 227, 229, 0.20)',
          filter: 'blur(48px)',
          width: '120%',
          height: '120%',
          top: '-10%',
          left: '-10%',
        }}
        aria-hidden="true"
      />
      <div className="liquid-glass w-20 h-20 rounded-2xl flex items-center justify-center">
        <Icon
          name="bolt"
          className="text-4xl"
          style={{ color: 'var(--primary-container)', fontVariationSettings: "'FILL' 1" }}
        />
      </div>
    </motion.div>

    {/* ── Tagline ─────────────────────────────────────────────────────── */}
    <motion.h1
      className="text-4xl md:text-5xl font-light tracking-tight text-center mb-10"
      variants={fadeUp}
    >
      <span className="text-white">Ask anything.</span>
      <br />
      <span className="text-slate-400">Upload anything.</span>
    </motion.h1>

    {/* ── Suggestion Grid ─────────────────────────────────────────────── */}
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl"
      variants={staggerContainer}
    >
      {suggestions.map((s) => (
        <motion.button
          key={s.text}
          type="button"
          className="liquid-glass px-5 py-3 rounded-xl flex items-center gap-3 text-left group cursor-pointer active:scale-[0.98] transition-transform"
          variants={fadeUp}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.10)' }}
          onClick={() => onSuggestClick?.(s.text)}
        >
          <Icon
            name={s.icon}
            className="text-xl text-slate-500 group-hover:text-violet-400 transition-colors"
          />
          <span className="text-sm font-medium text-slate-300">
            {s.text}
          </span>
        </motion.button>
      ))}
    </motion.div>
  </motion.div>
);

export default EmptyState;