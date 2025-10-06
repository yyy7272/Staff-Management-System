import React from 'react';
import { Download, Eye, Trash2, MoreVertical, FileText, FileImage, FileVideo, FileAudio, File as FileIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import type { SharedFile } from '../../types/sharedFile';

interface FileCardProps {
  file: SharedFile;
  onPreview?: (file: SharedFile) => void;
  onDownload?: (fileId: string, fileName: string) => void;
  onDelete?: (file: SharedFile) => void;
  onViewHistory?: (file: SharedFile) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onPreview,
  onDownload,
  onDelete,
  onViewHistory
}) => {
  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return 'image';
    }
    if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) {
      return 'audio';
    }
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return 'document';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return 'archive';
    }

    return 'other';
  };

  const getFileIcon = (type: string) => {
    const icons = {
      image: FileImage,
      video: FileVideo,
      audio: FileAudio,
      document: FileText,
      archive: FileIcon,
      other: FileIcon
    };
    return icons[type as keyof typeof icons] || FileIcon;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      image: 'bg-purple-100 text-purple-800',
      video: 'bg-red-100 text-red-800',
      audio: 'bg-blue-100 text-blue-800',
      document: 'bg-green-100 text-green-800',
      archive: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileType = getFileType(file.fileName);
  const Icon = getFileIcon(fileType);
  const fileExtension = file.fileName.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold truncate cursor-pointer hover:text-primary"
                onClick={() => onPreview?.(file)}
                title={file.fileName}
              >
                {file.fileName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={getTypeColor(fileType)}>
                  {fileExtension}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.fileSize)}
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
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(file)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={() => onDownload(file.id, file.fileName)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              {onViewHistory && file.versions && file.versions.length > 1 && (
                <DropdownMenuItem onClick={() => onViewHistory(file)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Version History
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(file)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {file.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {file.description}
          </p>
        )}

        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {file.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{file.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs">
              {file.uploaderName?.substring(0, 2).toUpperCase() || 'UN'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{file.uploaderName || 'Unknown'}</span>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 py-3">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div>
            {new Date(file.uploadedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-3">
            {file.downloadCount !== undefined && file.downloadCount > 0 && (
              <span>{file.downloadCount} downloads</span>
            )}
            {file.versions && file.versions.length > 0 && (
              <Badge variant="outline" className="text-xs">v{file.versions[file.versions.length - 1]?.versionNumber || 1}</Badge>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
