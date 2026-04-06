import React from 'react';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';

interface NarrativeBlockProps {
  content: string;
  actions?: Array<{ label: string; onClick: () => void }>;
}

const NarrativeBlock: React.FC<NarrativeBlockProps> = ({ content, actions }) => {
  return (
    <div className="liquid-glass rounded-lg p-4 mb-3 border border-white/10">
      <div className="flex gap-3">
        <Icon
          name="auto_awesome"
          className="text-violet-400 flex-shrink-0 text-xl"
        />
        <div className="flex-1">
          <p className="text-on-surface leading-relaxed mb-3">{content}</p>
          {actions && (
            <div className="flex gap-2">
              {actions.map((action, idx) => (
                <Button key={idx} variant="ghost" size="sm" onClick={action.onClick}>
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NarrativeBlock;
