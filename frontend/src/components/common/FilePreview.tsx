import React, { useState } from 'react';
import { X, Download, FileText, FileImage, FileVideo, FileAudio, File as FileIcon, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { SharedFile } from '../../types/sharedFile';

interface FilePreviewProps {
  file: SharedFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (fileId: string, fileName: string) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isOpen,
  onClose,
  onDownload
}) => {
  const [imageError, setImageError] = useState(false);

  if (!file) return null;

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return 'image';
    }
    // Videos
    if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) {
      return 'video';
    }
    // Audio
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) {
      return 'audio';
    }
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return 'document';
    }
    // Code
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'cs'].includes(ext)) {
      return 'code';
    }
    // Archive
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
      code: FileText,
      archive: FileIcon,
      other: FileIcon
    };
    return icons[type as keyof typeof icons] || FileIcon;
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
  // Files are stored on server, no direct URL available for preview
  const fileUrl = null;

  const renderPreview = () => {
    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
          <Icon className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Preview not available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Download the file to view its contents
          </p>
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {!imageError ? (
              <img
                src={fileUrl}
                alt={file.fileName}
                className="max-w-full max-h-96 mx-auto object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <FileImage className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Failed to load image</p>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <video controls className="max-w-full max-h-96 mx-auto">
              <source src={fileUrl} type={`video/${file.fileName.split('.').pop()}`} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <FileAudio className="w-16 h-16 text-muted-foreground mb-4" />
            <audio controls className="w-full max-w-md">
              <source src={fileUrl} type={`audio/${file.fileName.split('.').pop()}`} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'document':
        if (file.fileName.toLowerCase().endsWith('.pdf')) {
          return (
            <div className="bg-muted rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <iframe
                src={fileUrl}
                className="w-full h-full"
                title={file.fileName}
              />
            </div>
          );
        }
        // Fall through to default

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <Icon className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">{file.fileName}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {formatFileSize(file.fileSize)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Preview not available for this file type
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              {file.fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(file.id, file.fileName)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          <div className="border rounded-lg p-4">
            {renderPreview()}
          </div>

          {/* File Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-muted-foreground">File Size</label>
              <p>{formatFileSize(file.fileSize)}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Uploaded</label>
              <p>{new Date(file.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Uploaded By</label>
              <p>{file.uploaderName || 'Unknown'}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Downloads</label>
              <p>{file.downloadCount || 0} times</p>
            </div>
          </div>

          {/* Description */}
          {file.description && (
            <div>
              <label className="font-medium text-muted-foreground text-sm">Description</label>
              <p className="mt-1 text-sm">{file.description}</p>
            </div>
          )}

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div>
              <label className="font-medium text-muted-foreground text-sm">Tags</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {file.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Version Info */}
          {file.versions && file.versions.length > 0 && (
            <div>
              <label className="font-medium text-muted-foreground text-sm">Version</label>
              <p className="mt-1 text-sm">v{file.versions[file.versions.length - 1]?.versionNumber || 1}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
