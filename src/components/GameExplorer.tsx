import { useState, useEffect } from 'react'
import axios from 'axios'
import LaunchModal from './LaunchModal'

type Game = {
  id: number
  game: string
  image: string
  description: string
  estimated_duration: number
  type: string
  content_type: string
  supports_ipad: boolean
  supports_tts: boolean
  audience: {
    g1: boolean
    g2: boolean
    g3: boolean
    g4: boolean
    g5: boolean
    g6: boolean
    g7: boolean
    g8: boolean
    g9: boolean
    g10: boolean
    g11: boolean
    g12: boolean
    k: boolean
  }
}

export default function GameExplorer() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [gameType, setGameType] = useState<string>('all')
  const [standardId, setStandardId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(12)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'content' | 'search'>('content')
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('')

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true)
        
        let response;
        
        if (searchType === 'content') {
          // Use the content endpoint with filters
          const params: Record<string, any> = { page, page_size: pageSize }
          
          if (gameType !== 'all') {
            params.game_type = gameType
          }
          
          if (standardId) {
            params.standard_ids = [parseInt(standardId)]
          }
          
          response = await axios.get('/api/content', { params })
        } else {
          // Use the search endpoint
          response = await axios.post('/api/searches', {
            query: searchQuery,
            page,
            page_size: pageSize
          })
        }
        
        setGames(response.data.entries || [])
        setTotalPages(response.data.total_pages || 1)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching games:', err)
        setError(`Error: ${err.response?.data?.error || err.message || 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [page, pageSize, gameType, standardId, searchType, searchQuery])

  // Filter games based on search term
  const filteredGames = games.filter(game => 
    game.game.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Handle game launch
  const handleLaunchGame = (gameId: number) => {
    setSelectedGameId(gameId)
    setIsModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedGameId(null)
  }

  const getGradeRange = (audience: Game['audience']) => {
    const grades = []
    if (audience.k) grades.push('K')
    if (audience.g1) grades.push('1')
    if (audience.g2) grades.push('2')
    if (audience.g3) grades.push('3')
    if (audience.g4) grades.push('4')
    if (audience.g5) grades.push('5')
    if (audience.g6) grades.push('6')
    if (audience.g7) grades.push('7')
    if (audience.g8) grades.push('8')
    if (audience.g9) grades.push('9')
    if (audience.g10) grades.push('10')
    if (audience.g11) grades.push('11')
    if (audience.g12) grades.push('12')
    
    if (grades.length === 0) return 'N/A'
    
    return grades.join(', ')
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Game Explorer</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Games
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter search terms"
            />
          </label>
        </div>
        
        {/* Game Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Type
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'content' | 'search')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="content">Content API</option>
              <option value="search">Search API</option>
            </select>
          </label>
        </div>
        
        {/* Standard ID Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standard ID (Optional)
            <input
              type="text"
              value={standardId}
              onChange={(e) => setStandardId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter standard ID..."
            />
          </label>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Games Grid */}
      {!loading && !error && (
        <>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Games ({filteredGames.length})
            </h3>
            
            {filteredGames.length === 0 ? (
              <p className="text-gray-500 italic">No games found matching your criteria.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGames.map((game) => (
                  <div 
                    key={game.id} 
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                  >
                    {game.image && (
                      <div className="relative h-48 bg-gray-200">
                        <img 
                          src={game.image} 
                          alt={game.game} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{game.game}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {game.type}
                        </span>
                        {game.supports_ipad && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            iPad
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Duration: {game.estimated_duration} min
                      </p>
                      <div className="text-xs text-gray-500 mb-3">
                        <strong>Grades:</strong> {getGradeRange(game.audience)}
                      </div>
                      <button 
                        onClick={() => handleLaunchGame(game.id)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Launch Game
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  page === 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 
                  ? i + 1 
                  : page >= totalPages - 2 
                    ? totalPages - 4 + i 
                    : page - 2 + i
                
                if (pageNum <= 0 || pageNum > totalPages) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  page === totalPages 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </>
      )}
      
      {/* Launch Modal */}
      {isModalOpen && (
        <LaunchModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          gameId={selectedGameId?.toString()}
          standardId={standardId?.toString()}
        />
      )}
    </div>
  )
} 