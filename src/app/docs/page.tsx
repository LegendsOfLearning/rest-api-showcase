'use client';

import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export default function DocsPage() {
  const [src, setSrc] = useState<string>('');
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Use proxied swagger-ui to include token via cookie
    setSrc(API_ENDPOINTS.DOCS_SWAGGER_UI);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">OpenAPI Docs</h1>
          <a
            href={API_ENDPOINTS.DOCS_SWAGGER_UI}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Open in new tab
          </a>
        </div>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div className="h-[80vh] bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          {src && (
            <iframe title="Swagger UI" src={src} className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
}


