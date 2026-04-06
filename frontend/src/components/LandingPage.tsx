// ─── Landing Page ────────────────────────────────────────────────────────────
// Pre-auth hero page. Liquid glass aesthetic matching the design system.

import React from 'react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onGetStarted: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const CAPABILITIES = [
  { icon: 'database', label: 'Connect data sources' },
  { icon: 'chat', label: 'Ask in plain language' },
  { icon: 'insights', label: 'Explore insights' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => (
  <div
    className="min-h-screen w-full overflow-auto relative"
    style={{ background: 'var(--bg-void, #08080C)', color: 'var(--text-primary)' }}
  >
    {/* ── Ambient Orbs ──────────────────────────────────────────────── */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-40 right-[-120px] w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="absolute -bottom-40 left-[-120px] w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />
    </div>

    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <motion.section
      variants={stagger}
      initial="initial"
      animate="animate"
      className="relative mx-auto max-w-4xl px-6 py-24 lg:py-40 text-center"
    >
      {/* Brand */}
      <motion.div {...fadeUp} className="flex items-center justify-center gap-3 mb-8">
        <div
          className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center"
          style={{ boxShadow: '0 0 30px rgba(124, 58, 237, 0.15)' }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '24px',
              color: 'var(--accent-violet-light, #a78bfa)',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            bolt
          </span>
        </div>
        <span className="text-2xl font-medium tracking-tighter text-white">axon ai</span>
      </motion.div>

      {/* Tagline */}
      <motion.div {...fadeUp}>
        <h1
          className="text-5xl md:text-6xl font-light tracking-tight mb-4"
          style={{ lineHeight: 1.1 }}
        >
          <span className="text-white">Ask anything.</span>
          <br />
          <span style={{ color: 'var(--text-muted)' }}>Upload anything.</span>
        </h1>
      </motion.div>

      {/* Description */}
      <motion.p
        {...fadeUp}
        className="text-base leading-relaxed max-w-lg mx-auto mb-10"
        style={{ color: 'var(--text-secondary)' }}
      >
        Connect data sources, ask questions in natural language, and explore
        answers with an AI workspace built for analysis.
      </motion.p>

      {/* Capability chips */}
      <motion.div {...fadeUp} className="flex flex-wrap justify-center gap-3 mb-10">
        {CAPABILITIES.map((cap) => (
          <span
            key={cap.label}
            className="liquid-glass rounded-full px-4 py-2 text-xs font-medium flex items-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '14px', color: 'var(--accent-violet-light)' }}
            >
              {cap.icon}
            </span>
            {cap.label}
          </span>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeUp}>
        <button
          type="button"
          onClick={onGetStarted}
          className="btn-primary text-lg px-8 py-4 rounded-xl inline-flex items-center gap-2 group"
          style={{
            boxShadow: '0 0 40px rgba(255, 255, 255, 0.10)',
          }}
        >
          Get Started
          <span
            className="material-symbols-outlined transition-transform group-hover:translate-x-1"
            style={{ fontSize: '20px' }}
          >
            arrow_forward
          </span>
        </button>
      </motion.div>
    </motion.section>

    {/* ── Visual Cards ──────────────────────────────────────────────── */}
    <motion.section
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="relative mx-auto max-w-5xl px-6 pb-24"
      aria-hidden="true"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: 'terminal', title: 'SQL Editor', desc: 'Write and execute queries with AI assistance' },
          { icon: 'description', title: 'Document Analysis', desc: 'Upload PDFs, CSVs, and get instant insights' },
          { icon: 'account_tree', title: 'Schema Explorer', desc: 'Browse your database structure visually' },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.1 }}
            className="liquid-glass rounded-2xl p-6"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{
                background: 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '20px', color: 'var(--accent-violet-light)' }}
              >
                {card.icon}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">{card.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>

    {/* ── Footer ────────────────────────────────────────────────────── */}
    <footer
      className="text-center py-8"
      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
    >
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        © 2026 Axon. All rights reserved.
      </p>
    </footer>
  </div>
);

export default LandingPage;