// ─── App Shell ───────────────────────────────────────────────────────────────
// Full-page wrapper with ambient orbs behind all content.

import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => (
  <div className="app-shell">
    {/* ── Ambient Orbs ──────────────────────────────────────────────────── */}
    <div
      className="ambient-orb ai-pulse"
      style={{
        width: 600,
        height: 600,
        top: '-15%',
        left: '-10%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
      }}
      aria-hidden="true"
    />
    <div
      className="ambient-orb ai-pulse"
      style={{
        width: 500,
        height: 500,
        bottom: '-10%',
        right: '-8%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        animationDelay: '1.5s',
      }}
      aria-hidden="true"
    />
    <div
      className="ambient-orb ai-pulse"
      style={{
        width: 400,
        height: 400,
        top: '40%',
        right: '20%',
        background: 'radial-gradient(circle, rgba(185,200,222,0.04) 0%, transparent 70%)',
        animationDelay: '3s',
      }}
      aria-hidden="true"
    />

    {/* ── Content ───────────────────────────────────────────────────────── */}
    {children}
  </div>
);

export default AppShell;
