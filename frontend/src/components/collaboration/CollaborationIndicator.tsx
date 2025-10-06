import React from 'react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface OnlineUser {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
  status: number;
}

interface CollaborationIndicatorProps {
  connected: boolean;
  onlineUsers: OnlineUser[];
  className?: string;
}

const getStatusColor = (status: number) => {
  switch (status) {
    case 0: return 'bg-green-500'; // Online
    case 1: return 'bg-yellow-500'; // Away
    case 2: return 'bg-red-500'; // Busy
    default: return 'bg-gray-400'; // Offline
  }
};

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return 'Online';
    case 1: return 'Away';
    case 2: return 'Busy';
    default: return 'Offline';
  }
};

const getUserInitials = (userName: string) => {
  return userName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export const CollaborationIndicator: React.FC<CollaborationIndicatorProps> = ({
  connected,
  onlineUsers,
  className = '',
}) => {
  const otherUsers = onlineUsers.filter(user => user.userId !== 'current-user'); // Filter out current user

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {connected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <Badge variant={connected ? "secondary" : "destructive"} className="text-xs">
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* Online Users */}
      {connected && otherUsers.length > 0 && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {otherUsers.length} online
            </span>
            
            <div className="flex -space-x-2 ml-2">
              {otherUsers.slice(0, 3).map((user) => (
                <TooltipProvider key={user.userId}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="relative">
                        <Avatar className="h-6 w-6 border-2 border-white">
                          <AvatarImage src={user.avatar} alt={user.userName} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getUserInitials(user.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${getStatusColor(user.status)}`}
                          title={getStatusText(user.status)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                        <div className="text-xs mt-1">
                          Status: {getStatusText(user.status)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              
              {otherUsers.length > 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="h-6 w-6 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{otherUsers.length - 3}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-medium mb-2">Other users online:</div>
                        {otherUsers.slice(3).map((user) => (
                          <div key={user.userId} className="flex items-center space-x-2 py-1">
                            <div className={`h-2 w-2 rounded-full ${getStatusColor(user.status)}`} />
                            <span>{user.userName}</span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </>
      )}

      {/* No other users online */}
      {connected && otherUsers.length === 0 && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">
            No other users online
          </span>
        </>
      )}
    </div>
  );
};