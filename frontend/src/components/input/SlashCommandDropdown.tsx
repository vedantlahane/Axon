import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import { cn } from '../../utils/formatters';

interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  icon?: string;
}

interface SlashCommandDropdownProps {
  isOpen: boolean;
  inputValue: string;
  onSelect: (commandId: string) => void;
  position?: { top: number; left: number };
}

const COMMANDS: Command[] = [
  { id: 'model', name: '/model', description: 'Switch AI model', icon: 'smart_toy' },
  { id: 'connect', name: '/connect', description: 'Connect database', icon: 'database' },
  { id: 'upload', name: '/upload', description: 'Upload files', icon: 'upload' },
  { id: 'export', name: '/export', description: 'Export results', icon: 'download' },
  { id: 'clear', name: '/clear', description: 'Clear history', icon: 'delete' },
  { id: 'schema', name: '/schema', description: 'View schema', icon: 'schema' },
  { id: 'history', name: '/history', description: 'Show history', icon: 'history' },
  { id: 'help', name: '/help', description: 'Show help', icon: 'help' },
];

const SlashCommandDropdown: React.FC<SlashCommandDropdownProps> = ({
  isOpen,
  inputValue,
  onSelect,
  position,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filtered, setFiltered] = useState(COMMANDS);

  useEffect(() => {
    if (!isOpen) return;

    const searchTerm = inputValue.slice(1).toLowerCase(); // Remove the leading /
    const results = COMMANDS.filter(
      (cmd) =>
        cmd.name.includes(searchTerm) || cmd.description.toLowerCase().includes(searchTerm)
    );
    setFiltered(results);
    setSelectedIndex(0);
  }, [inputValue, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filtered.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selectedIndex]) {
            onSelect(filtered[selectedIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect, isOpen]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div
      className="absolute bottom-full mb-2 left-0 z-50 min-w-[300px]"
      style={position ? { top: `${position.top}px`, left: `${position.left}px` } : {}}
    >
      <div className="liquid-glass rounded-lg border border-white/10 overflow-hidden">
        {filtered.map((cmd, idx) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd.id)}
            className={cn(
              'w-full px-4 py-2 text-left flex items-center gap-3 transition-colors text-sm',
              idx === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
            )}
          >
            {cmd.icon && <Icon name={cmd.icon} style={{color: 'rgb(167, 139, 250)'}} />}
            <div className="flex-1">
              <p className="font-mono text-on-surface">{cmd.name}</p>
              <p className="text-xs text-on-surface-variant">{cmd.description}</p>
            </div>
            {cmd.shortcut && (
              <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                {cmd.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlashCommandDropdown;
