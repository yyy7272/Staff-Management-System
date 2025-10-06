import React from 'react';
import { Users, Settings, MoreVertical, Lock, Globe, Building } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import type { Group } from '../../types/group';

interface GroupCardProps {
  group: Group;
  onManageMembers?: (group: Group) => void;
  onEdit?: (group: Group) => void;
  onDelete?: (group: Group) => void;
  onViewDetails?: (group: Group) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onManageMembers,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const getTypeColor = (type: string) => {
    const colors = {
      project: 'bg-blue-100 text-blue-800',
      department: 'bg-green-100 text-green-800',
      company: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.custom;
  };

  const getVisibilityIcon = (visibility: string) => {
    const icons = {
      public: Globe,
      private: Lock,
      department: Building
    };
    const Icon = icons[visibility as keyof typeof icons] || Globe;
    return <Icon className="w-3 h-3" />;
  };

  const getVisibilityColor = (visibility: string) => {
    const colors = {
      public: 'text-green-600',
      private: 'text-red-600',
      department: 'text-yellow-600'
    };
    return colors[visibility as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={group.avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {group.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
                onClick={() => onViewDetails?.(group)}
                title={group.name}
              >
                {group.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={getTypeColor(group.type)}>
                  {group.type}
                </Badge>
                <span className={`flex items-center gap-1 text-xs ${getVisibilityColor(group.visibility)}`}>
                  {getVisibilityIcon(group.visibility)}
                  {group.visibility}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(group)}>
                  View Details
                </DropdownMenuItem>
              )}
              {onManageMembers && (
                <DropdownMenuItem onClick={() => onManageMembers(group)}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(group)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Group
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(group)}
                    className="text-red-600"
                  >
                    Delete Group
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {group.description || 'No description provided'}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{group.memberCount || 0} members</span>
          </div>
          <div className="text-muted-foreground">
            <span>Max: {group.maxMembers || 50}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 py-3">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div>
            Created {new Date(group.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-3">
            {group.allowFileSharing && (
              <Badge variant="outline" className="text-xs">File Sharing</Badge>
            )}
            {group.allowMemberInvite && (
              <Badge variant="outline" className="text-xs">Open Invite</Badge>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
