import React, { useState } from 'react';
import Button from '../../ui/Button';

interface ChartCardProps {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<{ label: string; value: number }>;
  onExport?: () => void;
  onFullscreen?: () => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ type, title, data, onExport, onFullscreen }) => {
  const [displayType, setDisplayType] = useState(type);
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="liquid-glass rounded-lg p-4 mb-3 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-on-surface text-lg">{title}</h3>
        <div className="flex gap-2">
          {['bar', 'line', 'pie'].map((t) => (
            <button
              key={t}
              onClick={() => setDisplayType(t as any)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                displayType === t ? 'bg-violet-500 text-white' : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chart visualization */}
      <div className="mb-4 p-4 bg-surface-container rounded-lg min-h-[200px] flex items-end justify-between gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1">
            <div
              className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t transition-all hover:opacity-80"
              style={{ height: `${(item.value / maxValue) * 180}px` }}
            />
            <span className="text-xs text-on-surface-variant text-center truncate w-full">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex gap-2">
        {onExport && <Button variant="ghost" size="sm" onClick={onExport}>Export PNG</Button>}
        {onFullscreen && <Button variant="ghost" size="sm" onClick={onFullscreen}>Fullscreen</Button>}
      </div>
    </div>
  );
};

export default ChartCard;
