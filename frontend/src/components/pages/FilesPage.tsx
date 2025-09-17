import React from 'react';

export const FilesPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Files</h1>
      <p className="text-gray-600 mt-2">File sharing functionality will be available soon.</p>
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-medium text-green-900">Features Coming Soon</h3>
        <ul className="mt-4 text-sm text-green-800 space-y-2">
          <li>• Upload and share files</li>
          <li>• Organize files by groups</li>
          <li>• Version control</li>
          <li>• Access permissions</li>
        </ul>
      </div>
    </div>
  );
};