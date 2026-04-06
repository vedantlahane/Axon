import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/formatters';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center">
        {trigger}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 min-w-max z-40',
            'liquid-glass rounded-lg border border-white/10 overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => (
            <div key={item.id}>
              {item.divider ? (
                <div className="h-px bg-white/10" />
              ) : (
                <button
                  onClick={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-on-surface hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  {item.icon && <span className="material-symbols-outlined text-base">{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
