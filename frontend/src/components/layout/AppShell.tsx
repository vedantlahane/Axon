// ─── App Shell ───────────────────────────────────────────────────────────────
// Full-page wrapper with ambient orbs behind all content.
// Matches FRONTEND_CONTEXT.md §5.1 "Ambient Orbs"

import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => (
  <div className="app-shell">

    {/* ── Ambient Orbs ──────────────────────────────────────────────────── 
         Desktop: 3 orbs | Tablet: 2 orbs | Mobile: 1 orb (300px, 3%)
         All: blur-[140px], pointer-events-none, behind content           */}

    {/* Orb 1 — White, 4%, 600×600, top-left (hidden on mobile) */}
    <div
      className="ambient-orb hidden md:block"
      style={{
        width: 600,
        height: 600,
        top: '-15%',
        left: '-10%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)',
        filter: 'blur(140px)',
        zIndex: -10,
        willChange: 'transform',
      }}
      aria-hidden="true"
    />

    {/* Orb 2 — Violet, 4%, 500×500, bottom-right (hidden on mobile) */}
    <div
      className="ambient-orb hidden sm:block"
      style={{
        width: 500,
        height: 500,
        bottom: '-10%',
        right: '-8%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.04) 0%, transparent 70%)',
        filter: 'blur(140px)',
        zIndex: -10,
        willChange: 'transform',
      }}
      aria-hidden="true"
    />

    {/* Orb 3 — White, 3%, 400×400, center 
         On mobile: shrinks to 300px, stays at 3% (the only visible orb) */}
    <div
      className="ambient-orb"
      style={{
        top: '40%',
        right: '20%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
        filter: 'blur(140px)',
        zIndex: -10,
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      {/* Size controlled via CSS to reduce on mobile */}
      <style>{`
        .ambient-orb:last-of-type {
          width: 300px;
          height: 300px;
        }
        @media (min-width: 768px) {
          .ambient-orb:last-of-type {
            width: 400px;
            height: 400px;
          }
        }
      `}</style>
    </div>

    {/* ── Content ───────────────────────────────────────────────────────── */}
    {children}
  </div>
);

export default AppShell;