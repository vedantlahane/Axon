// ─── Typing Indicator ────────────────────────────────────────────────────────
// Thinking state with shimmer, pulse-glow, and animated dots.
// Matches FRONTEND_CONTEXT.md §5.2 "TypingIndicator"

import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../lib/animations';

interface TypingIndicatorProps {
  /** Optional progress 0–100 */
  progress?: number;
  /** Optional step descriptions */
  steps?: Array<{ label: string; status: 'done' | 'active' | 'pending' }>;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  progress,
  steps,
}) => (
  <motion.div
    className="flex flex-col items-start mb-8 relative"
    initial="initial"
    animate="animate"
    variants={fadeUp}
    aria-label="Axon is thinking"
    role="status"
  >
    {/* ── Pulse Glow Background ─────────────────────────────────────── */}
    <div
      className="absolute -inset-4 rounded-[2rem] pulse-glow -z-10"
      style={{ background: 'rgba(185, 200, 222, 0.10)', filter: 'blur(48px)' }}
      aria-hidden="true"
    />

    {/* ── Avatar Row ────────────────────────────────────────────────── */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center border border-white/10">
        <span
          className="material-symbols-outlined text-sm"
          style={{ color: 'var(--accent-violet-light, #a78bfa)' }}
        >
          psychology
        </span>
      </div>
      <span
        className="text-[11px] uppercase font-medium text-slate-300"
        style={{ letterSpacing: '0.15em' }}
      >
        Axon
      </span>
    </div>

    {/* ── Thinking Card ─────────────────────────────────────────────── */}
    <div className="liquid-glass rounded-3xl p-6 md:p-8 relative overflow-hidden w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-medium text-slate-200">Thinking</span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent-violet-light, #a78bfa)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar (optional) */}
      {progress != null && (
        <div className="mb-4">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div
              className="h-full rounded-full shimmer transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: 'var(--accent-violet, #7C3AED)',
              }}
            />
          </div>
        </div>
      )}

      {/* Steps (optional) */}
      {steps && steps.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              {step.status === 'done' && (
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--color-success)', fontVariationSettings: "'FILL' 1", fontSize: '16px' }}>
                  check_circle
                </span>
              )}
              {step.status === 'active' && (
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: 'var(--accent-violet-light)' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--accent-violet-light)' }} />
                </span>
              )}
              {step.status === 'pending' && (
                <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center" />
              )}
              <span
                className={
                  step.status === 'active'
                    ? 'text-white font-medium'
                    : step.status === 'done'
                    ? 'text-slate-400'
                    : 'text-slate-600'
                }
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Shimmer skeleton lines */}
      <div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{ background: 'var(--bg-surface-lowest, #060e20)' }}
      >
        <div className="h-3 rounded shimmer" style={{ width: '75%', background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 rounded shimmer" style={{ width: '55%', background: 'rgba(255,255,255,0.04)', animationDelay: '0.3s' }} />
      </div>
    </div>
  </motion.div>
);

export default TypingIndicator;