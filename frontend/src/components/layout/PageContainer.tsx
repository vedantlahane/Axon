// ─── Page Container ──────────────────────────────────────────────────────────
// Max-width centered content wrapper with top padding for the TopBar.

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  noPadding?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  maxWidth = '720px',
  noPadding = false,
}) => (
  <div
    className={`mx-auto w-full flex-1 ${noPadding ? '' : 'px-4 pt-20 pb-8'} ${className}`}
    style={{ maxWidth }}
  >
    {children}
  </div>
);

export default PageContainer;
