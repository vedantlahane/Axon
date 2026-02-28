import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const orbitDots = Array.from({ length: 10 }, (_, idx) => idx);
  const mosaicTiles = Array.from({ length: 14 }, (_, idx) => idx);
  const particleDots = Array.from({ length: 28 }, (_, idx) => idx);
  const [tileOrder, setTileOrder] = useState(mosaicTiles);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTileOrder((prev) => shuffle(prev));
    }, 1200);
    return () => clearTimeout(timeout);
  }, [tileOrder]);

  const spring = {
    type: 'spring',
    damping: 20,
    stiffness: 300,
  } as const;

  return (
    <div className="min-h-screen w-full overflow-auto bg-[var(--bg-base)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(25,40,85,0.35),_transparent_70%)] text-[var(--text-primary)] dark:text-white">
      {/* Ambient gradients + particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          aria-hidden
          initial={{ opacity: 0.2, scale: 0.9 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute -top-40 right-[-120px] h-80 w-80 rounded-full bg-[var(--accent-soft)] blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0.15, scale: 0.9 }}
          animate={{ opacity: 0.28, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.1 }}
          className="absolute -bottom-40 left-[-120px] h-96 w-96 rounded-full bg-[var(--accent-soft)] blur-3xl"
        />
        <div className="absolute inset-0 opacity-70">
          {particleDots.map((dot) => (
            <span
              key={dot}
              className="absolute h-1.5 w-1.5 rounded-full bg-[var(--accent-soft)]"
              style={{
                top: `${(dot * 37) % 100}%`,
                left: `${(dot * 61) % 100}%`,
                animation: `float-${dot % 4} 8s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
      {/* Hero */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-6 py-20 lg:py-32"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
          <motion.div variants={itemVariants} className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#3b82f6] text-lg font-black text-white shadow-lg">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-sky-200"
                >
                  <path d="M4 4h9l7 8-7 8H4l7-8z" />
                  <path d="M11 4 7 12l4 8" />
                </svg>
              </div>
              <span className="text-3xl font-semibold tracking-wide text-(--text-primary) dark:text-white">Axon</span>
            </div>

            {/* Short app descriptor */}
            <p className="text-sm uppercase tracking-[0.35em] text-(--text-subtle) dark:text-white/50">
              AI data workspace
            </p>

            {/* Primary product description */}
            <p className="text-base leading-relaxed text-(--text-muted) dark:text-white/70 max-w-md">
              Axon helps you connect data sources, ask questions in natural language, and explore answers fast with an AI workspace built for analysis.
            </p>

            {/* Capability chips */}
            <div className="flex flex-wrap gap-2">
              {['Connect data', 'Ask in plain language', 'Explore insights'].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-(--border) bg-(--bg-panel) px-3 py-1 text-xs uppercase tracking-[0.2em] text-(--text-subtle)"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white rounded-xl font-semibold text-lg transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </motion.div>

          {/* Visual hero canvas */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-3xl border border-[var(--border)] bg-[var(--bg-panel)]/80 p-6 shadow-xl"
            aria-hidden
          >
            <div className="absolute inset-0 rounded-3xl border border-(--border)/40" />
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.12),transparent_45%)] opacity-70 animate-[videoGlow_8s_ease-in-out_infinite]" />
            <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(120deg,transparent_40%,rgba(37,99,235,0.08),transparent_70%)] opacity-60 animate-[videoSweep_10s_linear_infinite]" />
            <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.06)_1px,transparent_1px)] opacity-40" />
            <div className="absolute -right-10 top-10 h-28 w-28 rotate-12 rounded-3xl border border-(--border) bg-(--bg-panel)/60 shadow-lg" />
            <div className="absolute -left-8 bottom-8 h-20 w-20 -rotate-12 rounded-2xl border border-(--border) bg-(--bg-soft) shadow-md" />
            <div className="absolute right-10 -bottom-6 h-16 w-28 rotate-3 rounded-2xl border border-(--border) bg-(--bg-panel)/70 shadow-md" />
            <div className="absolute left-12 -top-8 h-12 w-12 -rotate-6 rounded-xl border border-(--border) bg-(--bg-soft) shadow-md" />
            <div className="absolute inset-x-12 top-6 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((dot) => (
                <span key={dot} className="h-1.5 w-1.5 rounded-full bg-(--accent-soft)" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-(--border) bg-(--bg-soft) p-5 relative overflow-hidden">
                {/* Tile grid with animated sweep */}
                <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(37,99,235,0.08),transparent_45%,rgba(37,99,235,0.12))] opacity-60 animate-[videoSweep_6s_linear_infinite]" />
                <div className="grid grid-cols-3 gap-3">
                  {tileOrder.map((tile, index) => (
                    <motion.span
                      key={tile}
                      layout
                      transition={spring}
                      className="aspect-square rounded-xl bg-(--accent-soft)"
                      initial={{ opacity: 0.6, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        animation: `tileDrift-${tile % 3} ${6 + (tile % 4)}s ease-in-out infinite`,
                        animationDelay: `${index * 0.08}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {/* Sparkline panel */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent,_rgba(37,99,235,0.08),_transparent)] opacity-60 animate-[videoSweep_4.5s_linear_infinite]" />
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-[var(--bg-soft)]" />
                    <div className="h-2 w-8 rounded-full bg-[var(--accent-soft)]" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {[70, 55, 80].map((width, index) => (
                      <div key={index} className="h-2 rounded-full bg-[var(--accent-soft)]" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                </div>
                {/* Avatar stack panel */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(37,99,235,0.08),_transparent_55%)] opacity-60 animate-[videoGlow_10s_ease-in-out_infinite]" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--accent-soft)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-3/4 rounded-full bg-[var(--bg-soft)]" />
                      <div className="h-2 w-1/2 rounded-full bg-[var(--accent-soft)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Visual gallery */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto max-w-screen-2xl px-8 pb-20 -mt-8"
        aria-hidden
      >
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative overflow-hidden rounded-3xl border border-(--border) bg-(--bg-panel) p-6 shadow-lg ${
                index === 0
                  ? 'rotate-2 min-h-65'
                  : index === 1
                    ? '-rotate-2 min-h-80'
                    : 'rotate-2 min-h-70'
              }`}
            >
              {/* Panel glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_55%)]" />
              <div className="relative flex h-full flex-col gap-6">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((dot) => (
                    <span key={dot} className="h-2 w-2 rounded-full bg-(--accent-soft)" />
                  ))}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 18 }, (_, tile) => (
                    <span key={tile} className="h-4 rounded-lg bg-(--bg-soft)" />
                  ))}
                </div>
                <div className="flex gap-3">
                  <span className="h-10 w-10 rounded-xl bg-(--accent-soft)" />
                  <span className="h-10 w-20 rounded-xl bg-(--bg-soft)" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-[var(--border)] bg-[var(--bg-panel)]/50 dark:bg-white/5 backdrop-blur"
      >
        <div className="mx-auto max-w-7xl px-6 py-12 text-center text-[var(--text-muted)] dark:text-white/60">
          <p>&copy; 2026 Axon. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
};

const shuffle = <T,>(array: T[]) => {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export default LandingPage;
