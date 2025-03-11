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
  estimated_duration: number;
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('query') || '';
  
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use the content endpoint with search parameter
      const response = await axios.get('/api/content', {
        params: {
          search: query,
          page: 1,
          page_size: 10
        }
      });
      
      // Transform the response to match our expected format
      const results = response.data.entries?.map((item: any) => ({
        id: item.id,
        game: item.game || 'Unknown Title',
        image: item.image || '',
        description: item.description || 'No description available',
        type: item.type || 'Unknown',
        estimated_duration: item.estimated_duration || 0
      })) || [];
      
      setResults(results);
      
      // Update URL
      router.push(`/search?query=${encodeURIComponent(query)}`);
    } catch (err: any) {
      console.error('Error searching content:', err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };
  
  // Load search results if query is in URL
  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      const fetchInitialResults = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await axios.get('/api/content', {
            params: {
              search: queryParam,
              page: 1,
              page_size: 10
            }
          });
          
          // Transform the response to match our expected format
          const results = response.data.entries?.map((item: any) => ({
            id: item.id,
            game: item.game || 'Unknown Title',
            image: item.image || '',
            description: item.description || 'No description available',
            type: item.type || 'Unknown',
            estimated_duration: item.estimated_duration || 0
          })) || [];
          
          setResults(results);
        } catch (err: any) {
          console.error('Error searching content:', err);
          setError(err.message || 'An error occurred while searching');
        } finally {
          setLoading(false);
        }
      };
      
      fetchInitialResults();
    }
  }, [queryParam]);
  
  return (
    <div className="w-full">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Search</h2>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for games..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div>
            {results.length === 0 ? (
              queryParam ? (
                <div className="text-center py-12 text-gray-500">
                  No results found for "{queryParam}".
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Enter a search term to find games.
                </div>
              )
            ) : (
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
                      <div className="flex items-center justify-between mt-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {game.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {game.estimated_duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 