// ─── Dropdown ────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (itemId: string) => void;
  align?: 'left' | 'right';
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, items, onSelect, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center">
        {trigger}
      </button>
      {isOpen && (
        <div
          className={`absolute top-full mt-2 min-w-max z-40 glass-strong rounded-lg overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) =>
            item.divider ? (
              <div key={item.id} className="gradient-separator mx-2 my-1" />
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => { onSelect(item.id); setIsOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors min-h-[40px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.icon && (
                  <Icon
                    name={item.icon}
                    className="text-[16px] text-[var(--text-ghost)]"
                    style={{ minWidth: 16 }}
                  />
                )}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;