import React, { useState, useEffect } from 'react';
import { Upload, Search, Grid, List, FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { sharedFileService } from '../../services/sharedFileService';
import { groupService } from '../../services/groupService';
import type { SharedFile } from '../../types/sharedFile';
import type { Group } from '../../types/group';
import { FileUploadForm } from '../forms/FileUploadForm';
import { FileCard } from '../common/FileCard';
import { FilePreview } from '../common/FilePreview';
import { toast } from 'sonner';

export const FilesPage = () => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await sharedFileService.getFiles();
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    }
  };

  useEffect(() => {
    loadFiles();
    loadGroups();
  }, []);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = groupFilter === 'all' || file.groupId === groupFilter;
    const matchesType = typeFilter === 'all' || getFileType(file.fileName) === typeFilter;
    return matchesSearch && matchesGroup && matchesType;
  });

  const handleUploadFile = async (fileData: any) => {
    try {
      console.log('Uploading file with data:', fileData);
      await sharedFileService.uploadFile(fileData);
      await loadFiles();
      setIsUploadDialogOpen(false);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error?.details?.message || error?.message || 'Failed to upload file';
      toast.error(errorMessage);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const blob = await sharedFileService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await sharedFileService.deleteFile(fileId);
      await loadFiles();
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) return 'image';
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(extension || '')) return 'presentation';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) return 'archive';
    return 'other';
  };

  const handlePreviewFile = (file: SharedFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600 mt-2">Share and manage files with your teams</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
            </DialogHeader>
            <FileUploadForm onSubmit={handleUploadFile} onCancel={() => setIsUploadDialogOpen(false)} groups={groups} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="spreadsheet">Spreadsheets</option>
            <option value="presentation">Presentations</option>
            <option value="pdf">PDFs</option>
            <option value="archive">Archives</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Files Grid/List */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || groupFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload your first file to get started'}
          </p>
          {!searchTerm && groupFilter === 'all' && typeFilter === 'all' && (
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onPreview={handlePreviewFile}
              onDownload={handleDownloadFile}
              onDelete={() => handleDeleteFile(file.id)}
            />
          ))}
        </div>
      )}

      {/* File Preview Dialog */}
      <FilePreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={handleDownloadFile}
      />
    </div>
  );
};
