import React from 'react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Edit3 } from 'lucide-react';

interface TypingIndicatorProps {
  fieldName: string;
  typingUsers: string[];
  className?: string;
  showFieldName?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  fieldName,
  typingUsers,
  className = '',
  showFieldName = false,
}) => {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
      return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center space-x-1">
              <Edit3 className="h-3 w-3 text-blue-500 animate-pulse" />
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                {typingUsers.length} typing
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">
                {showFieldName ? `In "${fieldName}":` : 'Currently typing:'}
              </div>
              <div className="mt-1">{getTypingText()}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Animated typing dots */}
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};