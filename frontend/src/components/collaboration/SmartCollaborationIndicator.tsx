import React from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { CollaborationIndicator } from './CollaborationIndicator';

interface SmartCollaborationIndicatorProps {
  className?: string;
}

export const SmartCollaborationIndicator: React.FC<SmartCollaborationIndicatorProps> = ({
  className = '',
}) => {
  const collaboration = useCollaboration();

  return (
    <CollaborationIndicator
      connected={collaboration.state.connected}
      onlineUsers={collaboration.state.onlineUsers}
      className={className}
    />
  );
};