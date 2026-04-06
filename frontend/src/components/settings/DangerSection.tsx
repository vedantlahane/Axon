import React, { useState } from 'react';
import Button from '../ui/Button';

interface DangerSectionProps {
  onClearHistory?: () => void;
  onDeleteAccount?: () => void;
}

const DangerSection: React.FC<DangerSectionProps> = ({ onClearHistory, onDeleteAccount }) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="liquid-glass rounded-xl p-6 border border-error/30 bg-error/5">
      <h2 className="text-xl font-semibold text-error mb-6">Danger Zone</h2>
      <div className="space-y-4">
        {/* Clear History */}
        <div>
          {showConfirmClear ? (
            <div className="space-y-2">
              <p className="text-on-surface">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onClearHistory?.();
                    setShowConfirmClear(false);
                  }}
                >
                  Yes, Delete
                </Button>
                <Button variant="ghost" onClick={() => setShowConfirmClear(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="danger"
              onClick={() => setShowConfirmClear(true)}
              className="w-full"
            >
              Clear All Conversations
            </Button>
          )}
        </div>

        {/* Delete Account */}
        <div>
          {showConfirmDelete ? (
            <div className="space-y-2">
              <p className="text-on-surface">
                This will permanently delete your account and all associated data.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onDeleteAccount?.();
                    setShowConfirmDelete(false);
                  }}
                >
                  Yes, Delete Account
                </Button>
                <Button variant="ghost" onClick={() => setShowConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="danger"
              onClick={() => setShowConfirmDelete(true)}
              className="w-full"
            >
              Delete Account
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DangerSection;
