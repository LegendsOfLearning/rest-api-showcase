'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

type GameResult = {
  id: number;
  game: string;
  image: string;
  description: string;
  type: string;
  content_type: string;
  estimated_duration: number;
  supports_ipad: boolean;
  supports_tts: boolean;
  video_preview_url?: string;
  version: {
    id: number;
    url: string;
    language_key: string;
    api_version: string;
  };
  grade_levels: string[];
  stats: {
    teacher_rating_avg: number;
    teacher_rating_count: number;
    student_rating_avg: number;
    student_rating_count: number;
    ease_of_play_avg: number;
    content_integration_avg: number;
    composite_rating_score: number;
    composite_rating_avg: number;
    suggested_use_summary: string;
  };
};

type ContentType = 'simulation' | 'video' | 'question' | 'instructional';
type GradeLevel = 'K' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const queryParam = searchParams?.get('query') || '';
  const pageParam = parseInt(searchParams?.get('page') || '1');
  const perPageParam = parseInt(searchParams?.get('per_page') || '10');
  const typeParam = searchParams?.get('type') || '';
  const gradesParam = searchParams?.get('grades')?.split(',').filter(Boolean) || [];
  const supportsTtsParam = searchParams?.get('supports_tts') === 'true';
  const supportsIpadParam = searchParams?.get('supports_ipad') === 'true';
  
  // State
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(pageParam);
  const [perPage, setPerPage] = useState(perPageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedType, setSelectedType] = useState<string>(typeParam);
  const [selectedGrades, setSelectedGrades] = useState<string[]>(gradesParam);
  const [supportsTts, setSupportsTts] = useState(supportsTtsParam);
  const [supportsIpad, setSupportsIpad] = useState(supportsIpadParam);
  
  // Constants
  const contentTypes: { value: ContentType; label: string }[] = [
    { value: 'instructional', label: 'Instructional' },
    { value: 'question', label: 'Question' },
    { value: 'simulation', label: 'Simulation' },
    { value: 'video', label: 'Video' }
  ];
  
  const gradeOptions: GradeLevel[] = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      params.set('page', page.toString());
      params.set('per_page', perPage.toString());
      if (selectedType) params.set('type', selectedType);
      if (selectedGrades.length > 0) params.set('grades', selectedGrades.join(','));
      if (supportsTts) params.set('supports_tts', 'true');
      if (supportsIpad) params.set('supports_ipad', 'true');
      
      // Make API request
      const response = await axios.get(`/api/content?${params.toString()}`);
      
      if (response.data) {
        setResults(response.data.entries || []);
        setTotalPages(response.data.total_pages || 1);
        setTotalCount(response.data.total_entries || 0);
      }
      
      // Update URL
      router.push(`/search?${params.toString()}`);
    } catch (err: any) {
      console.error('Error searching content:', err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };
  
  // Load search results if query is in URL
  useEffect(() => {
    if (Object.keys(searchParams?.toString() || {}).length > 0) {
      handleSearch();
    }
  }, [page, perPage]); // Only reload when pagination changes
  
  // Handle grade selection
  const handleGradeChange = (grade: GradeLevel) => {
    const newGrades = selectedGrades.includes(grade)
      ? selectedGrades.filter(g => g !== grade)
      : [...selectedGrades, grade];
    setSelectedGrades(newGrades);
  };
  
  return (
    <div className="w-full">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Search Content</h2>
        
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Search Input */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <div className="flex gap-4">
              <input
                id="search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for games..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(selectedType === type.value ? '' : type.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedType === type.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Grade Levels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {gradeOptions.map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleGradeChange(grade)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedGrades.includes(grade)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {grade === 'K' ? 'Kindergarten' : `Grade ${grade}`}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Additional Filters */}
            <div className="md:col-span-2 flex flex-wrap gap-6">
              {/* Items per page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Items per page
                </label>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              
              {/* Feature Toggles */}
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={supportsTts}
                    onChange={(e) => setSupportsTts(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Supports TTS</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={supportsIpad}
                    onChange={(e) => setSupportsIpad(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">iPad Compatible</span>
                </label>
              </div>
            </div>
          </div>
        </form>
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Results */}
        {!loading && !error && (
          <>
            {/* Results Count */}
            {results.length > 0 && (
              <div className="text-sm text-gray-600 mb-4">
                Showing {Math.min((page - 1) * perPage + 1, totalCount)} to {Math.min(page * perPage, totalCount)} of {totalCount} results
              </div>
            )}
            
            {/* Results Grid */}
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {Object.keys(searchParams?.toString() || {}).length > 0
                  ? 'No results found for your search criteria.'
                  : 'Enter a search term or select filters to find content.'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((game) => (
                    <div key={game.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {game.image && (
                        <img 
                          src={game.image} 
                          alt={game.game} 
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{game.game}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-3">{game.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {game.type}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {game.estimated_duration} min
                          </span>
                          {game.supports_tts && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              TTS
                            </span>
                          )}
                          {game.supports_ipad && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              iPad
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(Math.max(page - 1, 1))}
                        disabled={page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {page} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setPage(Math.min(page + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
} 