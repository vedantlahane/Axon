import React from 'react';
import { cn } from '../../utils/formatters';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex gap-6 border-b border-surface-variant', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'pb-3 font-medium transition-colors',
            activeTab === tab.id
              ? 'border-b-2 border-violet-400 text-on-surface'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
