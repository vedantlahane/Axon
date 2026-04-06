import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator: React.FC = () => (
  <motion.div
    className="flex flex-col items-start mb-12"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    aria-label="Axon is thinking"
    role="status"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center">
        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--violet-bright)' }}>psychology</span>
      </div>
      <span className="label-md" style={{ color: '#e2e8f0', letterSpacing: '0.1em' }}>Axon</span>
    </div>
    <div className="flex items-center gap-2 text-lg" style={{ color: 'rgb(148,163,184)' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: 'var(--violet-bright)' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  </motion.div>
);

export default TypingIndicator;
