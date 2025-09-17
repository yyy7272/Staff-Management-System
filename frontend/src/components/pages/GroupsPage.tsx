import React from 'react';

export const GroupsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
      <p className="text-gray-600 mt-2">Group management functionality will be available soon.</p>
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900">Features Coming Soon</h3>
        <ul className="mt-4 text-sm text-blue-800 space-y-2">
          <li>• Create and manage groups</li>
          <li>• Add and remove members</li>
          <li>• Share files within groups</li>
          <li>• Real-time collaboration</li>
        </ul>
      </div>
    </div>
  );
};