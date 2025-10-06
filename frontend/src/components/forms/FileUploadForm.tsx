import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Upload, File, X } from 'lucide-react';
import type { Group } from '../../types/group';
import type { UploadFileRequest } from '../../types/sharedFile';

interface FileUploadFormProps {
  onSubmit: (data: UploadFileRequest) => void;
  onCancel: () => void;
  groups: Group[];
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({ onSubmit, onCancel, groups }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<Omit<UploadFileRequest, 'file'>>({
    defaultValues: {
      groupId: '',
      description: '',
      tags: '',
      shareType: 'group'
    }
  });

  const watchGroupId = watch('groupId');
  const watchTags = watch('tags');
  const watchShareType = watch('shareType');

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = (data: Omit<UploadFileRequest, 'file'>) => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const uploadRequest: UploadFileRequest = {
      file: selectedFile,
      groupId: data.groupId,
      description: data.description || '',
      tags: data.tags || '',
      shareType: data.shareType
    };

    onSubmit(uploadRequest);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* File Upload Area */}
      <div className="space-y-4">
        <Label>File Upload *</Label>

        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Drop your file here, or{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-600">
                Supports most file types, up to 50MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="*/*"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <File className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* File Details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="groupId">Share with Group *</Label>
          <Select
            value={watchGroupId}
            onValueChange={(value) => setValue('groupId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!watchGroupId && (
            <p className="text-sm text-red-600 mt-1">Please select a group</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Describe the file or add notes..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="Enter tags separated by commas (e.g., document, important, project)"
          />
        </div>

        <div>
          <Label htmlFor="shareType">Share Type</Label>
          <Select
            value={watchShareType}
            onValueChange={(value) => setValue('shareType', value as 'group' | 'company' | 'department')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select share type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group">Group Only</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="company">Company Wide</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !selectedFile || !watchGroupId}
        >
          {isSubmitting ? 'Uploading...' : 'Upload File'}
        </Button>
      </div>
    </form>
  );
};