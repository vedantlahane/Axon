import React from 'react';
import Icon from '../../ui/Icon';

interface SystemCardProps {
  type: 'model_switch' | 'connection' | 'info';
  message: string;
}

const SystemCard: React.FC<SystemCardProps> = ({ type, message }) => {
  const icons = {
    model_switch: 'smart_toy',
    connection: 'database',
    info: 'info',
  };

  return (
    <div className="flex justify-center mb-3">
      <div className="liquid-glass rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
        <Icon name={icons[type]} style={{color: 'rgb(167, 139, 250)'}} />
        <p className="text-sm text-on-surface-variant">{message}</p>
      </div>
    </div>
  );
};

export default SystemCard;
