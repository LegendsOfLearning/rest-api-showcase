'use client';

export default function Home() {
  return (
    <div className="prose max-w-none">
      <h1>Welcome to the Legends of Learning API Demo</h1>
      <p>
        This demo application showcases the various endpoints and features available in the Legends of Learning REST API.
        Use the navigation above to explore different sections:
      </p>
      <ul>
        <li><strong>Standards</strong> - Browse and search educational standards</li>
        {/* Temporarily hidden
        <li><strong>Assignments</strong> - Create and manage assignments</li>
        */}
        <li><strong>Users</strong> - Manage teachers and students</li>
        <li><strong>Search</strong> - Search across all content types</li>
      </ul>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              All API requests are authenticated using your provided credentials. Your token will be automatically included in all requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 