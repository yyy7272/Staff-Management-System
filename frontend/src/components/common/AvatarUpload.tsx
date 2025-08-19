import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, User, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';

interface AvatarUploadProps {
  currentImageUrl?: string;
  employeeId?: string;
  employeeName?: string;
  onUploadSuccess?: (imageUrl: string, thumbnailUrl: string) => void;
  onUploadError?: (error: string) => void;
  onDelete?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentImageUrl,
  employeeId,
  employeeName = '',
  onUploadSuccess,
  onUploadError,
  onDelete,
  disabled = false,
  size = 'md'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: { avatar: 'w-16 h-16', upload: 'w-16 h-16', text: 'text-xs' },
    md: { avatar: 'w-24 h-24', upload: 'w-24 h-24', text: 'text-sm' },
    lg: { avatar: 'w-32 h-32', upload: 'w-32 h-32', text: 'text-base' }
  };

  const config = sizeConfig[size];

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPG, PNG, GIF, WebP)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  // Create preview URL
  const createPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  };

  // Upload file to server
  const uploadFile = async (file: File) => {
    if (!employeeId) {
      setError('Employee ID is required for upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/Employee/${employeeId}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Upload failed');
      }

      const result = await response.json();
      
      // Clear preview and error
      setPreviewUrl('');
      setError('');
      
      // Call success callback
      onUploadSuccess?.(result.profileImageUrl, result.thumbnailImageUrl);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsUploading(true);

    // Create preview
    const cleanup = createPreview(file);

    try {
      await uploadFile(file);
    } finally {
      setIsUploading(false);
      cleanup();
    }
  }, [employeeId, onUploadSuccess, onUploadError]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, isUploading, handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input value
    e.target.value = '';
  };

  // Handle delete avatar
  const handleDelete = async () => {
    if (!employeeId) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/Employee/${employeeId}/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete avatar');
      }

      setPreviewUrl('');
      setError('');
      onDelete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayImageUrl = previewUrl || currentImageUrl;
  const hasImage = Boolean(displayImageUrl);

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className={config.avatar}>
          <AvatarImage src={displayImageUrl} alt={employeeName} />
          <AvatarFallback>
            {employeeName ? getInitials(employeeName) : <User className="w-1/2 h-1/2" />}
          </AvatarFallback>
        </Avatar>

        {/* Loading overlay */}
        {isUploading && (
          <div className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center ${config.avatar}`}>
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* Delete button */}
        {hasImage && !isUploading && !disabled && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0"
            onClick={handleDelete}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {!disabled && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${config.upload}
            ${isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : hasImage 
                ? 'border-gray-200 hover:border-gray-300' 
                : 'border-gray-300 hover:border-gray-400'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled || isUploading}
          />
          
          <div className="flex flex-col items-center space-y-1">
            <Upload className={`w-6 h-6 text-gray-400`} />
            <p className={`${config.text} text-gray-600`}>
              {hasImage ? 'Change' : 'Upload'}
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="w-full max-w-sm">
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Instructions */}
      {!disabled && !hasImage && (
        <p className="text-xs text-gray-500 text-center max-w-sm">
          Drag and drop an image or click to browse. Recommended size: 200x200px
        </p>
      )}
    </div>
  );
};

export default AvatarUpload;