import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Layout from '../components/Layout'
import LaunchModal from '../components/LaunchModal'

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

export default function SearchPage() {
  const router = useRouter()
  const { 
    query: queryParam = '',
    page: pageParam = '1',
    game_type: gameTypeParam = '',
    subject: subjectParam = '',
    grade: gradeParam = ''
  } = router.query
  
  const [searchQuery, setSearchQuery] = useState(queryParam as string)
  const [gameType, setGameType] = useState(gameTypeParam as string)
  const [subject, setSubject] = useState(subjectParam as string)
  const [grade, setGrade] = useState(gradeParam as string)
  const [page, setPage] = useState(parseInt(pageParam as string) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Update URL when state changes
  useEffect(() => {
    const query: Record<string, string> = { page: page.toString() }
    
    if (searchQuery) {
      query.query = searchQuery
    }
    
    if (gameType) {
      query.game_type = gameType
    }
    
    if (subject) {
      query.subject = subject
    }
    
    if (grade) {
      query.grade = grade
    }
    
    router.push({
      pathname: '/search',
      query
    }, undefined, { shallow: true })
  }, [page, searchQuery, gameType, subject, grade, router])
  
  // Update state when URL parameters change
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam as string)
    }
    
    if (gameTypeParam) {
      setGameType(gameTypeParam as string)
    }
    
    if (subjectParam) {
      setSubject(subjectParam as string)
    }
    
    if (gradeParam) {
      setGrade(gradeParam as string)
    }
    
    if (pageParam) {
      setPage(parseInt(pageParam as string) || 1)
    }
  }, [queryParam, gameTypeParam, subjectParam, gradeParam, pageParam])
  
  const fetchGames = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: Record<string, any> = {
        query: searchQuery,
        page,
        page_size: 10
      }
      
      if (gameType) {
        params.game_type = gameType
      }
      
      if (subject) {
        params.subject = subject
      }
      
      if (grade) {
        params.grade = grade
      }
      
      const response = await axios.post('/api/searches', params)
      
      setGames(response.data.entries || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (err: any) {
      console.error('Error searching games:', err)
      setError(`Error: ${err.response?.data?.error || err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (searchQuery || gameType || subject || grade) {
      fetchGames()
    }
  }, [page])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page
    fetchGames()
  }
  
  const handleLaunch = (gameId: number) => {
    setSelectedGame(gameId)
    setIsModalOpen(true)
  }
  
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedGame(null)
  }
  
  const getGradeRange = (audience: Game['audience'] | null | undefined) => {
    if (!audience) return 'N/A';
    
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
    <Layout>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Advanced Search</h2>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Query
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter search terms"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Type
                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  <option value="simulation">Simulation</option>
                  <option value="video">Video</option>
                  <option value="question">Question</option>
                  <option value="instructional">Instructional</option>
                </select>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Subjects</option>
                  <option value="math">Math</option>
                  <option value="science">Science</option>
                  <option value="ela">ELA</option>
                  <option value="social-studies">Social Studies</option>
                </select>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Grades</option>
                  <option value="k">Kindergarten</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          <>
            {games.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery || gameType || subject || grade ? 'No games found matching your criteria.' : 'Enter search criteria to find games.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                  <div key={game.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={game.image} 
                        alt={game.game} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image'
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{game.game}</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {game.type}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {game.estimated_duration} min
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{game.description}</p>
                      <div className="text-xs text-gray-500 mb-3">
                        <strong>Grades:</strong> {getGradeRange(game.audience)}
                      </div>
                      <button
                        onClick={() => handleLaunch(game.id)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Launch Standard
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
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
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
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
      </div>
      
      {isModalOpen && (
        <LaunchModal
          isOpen={isModalOpen}
          onClose={closeModal}
          gameId={selectedGame?.toString()}
        />
      )}
    </Layout>
  )
} 