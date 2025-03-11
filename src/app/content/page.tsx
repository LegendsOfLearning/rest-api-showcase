'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ContentExplorer from '../../components/ContentExplorer';

export default function ContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = searchParams?.get('subject') || 'math';
  
  // Set default subject to math if not specified
  useEffect(() => {
    if (!searchParams?.get('subject')) {
      router.push('/content?subject=math');
    }
  }, [router, searchParams]);
  
  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push('/content?subject=math')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subject === 'math' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Math
          </button>
          <button
            onClick={() => router.push('/content?subject=science')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subject === 'science' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Science
          </button>
          <button
            onClick={() => router.push('/search')}
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
          >
            Advanced Search
          </button>
        </div>
      </div>
      
      <ContentExplorer subject={subject} />
    </div>
  );
} 