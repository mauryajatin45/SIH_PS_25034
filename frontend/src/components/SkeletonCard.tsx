import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 rounded-full w-16"></div>
        ))}
      </div>

      {/* Match Score */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded"></div>
      </div>

      {/* Why Match */}
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
      </div>

      {/* Languages */}
      <div className="mb-4">
        <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
        <div className="flex gap-1">
          <div className="h-5 bg-gray-200 rounded w-12"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}