import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ProfileSectionProps {
  displayName?: string;
  email?: string;
  onSave?: (displayName: string) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ displayName = '', email = '', onSave }) => {
  const [name, setName] = useState(displayName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave?.(name);
    setIsSaving(false);
  };

  return (
    <div className="liquid-glass rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-on-surface mb-6">Profile</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar fallback={name.charAt(0)} size="lg" />
          <div>
            <p className="font-medium text-on-surface">{name}</p>
            <p className="text-sm text-on-surface-variant">{email}</p>
          </div>
        </div>
        <Input
          label="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <Button variant="primary" loading={isSaving} onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProfileSection;
