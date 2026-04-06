import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6 text-center">
    {/* Large 404 */}
    <div className="relative">
      <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: 'rgba(124, 58, 237, 0.15)' }} />
      <span className="relative display-lg" style={{ color: 'var(--violet-bright)', fontWeight: 900 }}>404</span>
    </div>

    <div className="space-y-3">
      <h1 className="headline-md text-white">Page not found</h1>
      <p className="body-md" style={{ maxWidth: '360px', color: 'var(--text-secondary)' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>

    <div className="flex gap-3">
      <Link to="/" className="btn-primary">
        <span className="material-symbols-outlined text-sm">home</span>
        Go Home
      </Link>
      <Link to="/library" className="btn-glass">
        <span className="material-symbols-outlined text-sm">history</span>
        Library
      </Link>
    </div>
  </div>
);

export default NotFound;
