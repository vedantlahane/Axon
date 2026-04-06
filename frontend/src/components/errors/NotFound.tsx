// ─── Not Found ───────────────────────────────────────────────────────────────

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

const NotFound: React.FC = () => (
  <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6 text-center">
    {/* 404 */}
    <div className="relative">
      <div
        className="absolute inset-0 blur-3xl rounded-full -z-10"
        style={{ background: 'rgba(124, 58, 237, 0.15)' }}
        aria-hidden="true"
      />
      <span
        className="relative text-8xl font-bold tracking-tighter"
        style={{ color: 'var(--accent-violet-light, #a78bfa)' }}
      >
        404
      </span>
    </div>

    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Page not found
      </h1>
      <p
        className="text-sm leading-relaxed"
        style={{ maxWidth: '360px', color: 'var(--text-secondary)' }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>

    <div className="flex gap-3">
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <Icon name="home" size={16} />
        Go Home
      </Link>
      <Link to="/library" className="btn-glass inline-flex items-center gap-2">
        <Icon name="auto_stories" size={16} />
        Library
      </Link>
    </div>
  </div>
);

export default NotFound;