import { useState, useEffect } from 'react'
import axios from 'axios'
import LaunchModal from './LaunchModal'
import Image from 'next/image'

type Standard = {
  id: number
  learning_objective: string
  image_key: string
  standard_code: string
  ngss_dci_name?: string
  question_count?: number
}

type StandardSet = {
  id: string
  name: string
  subject_area: string
  grade_level?: string
  public?: boolean
}

type StandardsExplorerProps = {
  standardSet?: string
}

export default function StandardsExplorer({ standardSet = 'ngss' }: StandardsExplorerProps) {
  // State management
  const [standardSets, setStandardSets] = useState<StandardSet[]>([])
  const [standards, setStandards] = useState<Standard[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [standardType, setStandardType] = useState<'NGSS' | 'CCSS'>('NGSS')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [subject, setSubject] = useState<string>('science')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch standard sets
  useEffect(() => {
    const fetchStandardSets = async () => {
      try {
        setLoading(true)
        // Use the standard_sets API endpoint
        const response = await axios.get('/api/standard_sets')
        
        if (response.data && response.data.results) {
          // Filter for NGSS or CCSS based on standardType
          const filteredSets = response.data.results.filter((set: StandardSet) => 
            set.name.includes(standardType)
          )
          
          setStandardSets(filteredSets)
          
          // Set the first standard set as selected if available
          if (filteredSets.length > 0 && !selectedSetId) {
            setSelectedSetId(filteredSets[0].id)
          }
          
          setError(null)
        } else {
          console.log('No standard sets found in API response')
          setStandardSets([])
          setError('No standard sets available')
        }
      } catch (err) {
        console.error('Error fetching standard sets:', err)
        setError('Failed to load standard sets')
      } finally {
        setLoading(false)
      }
    }

    fetchStandardSets()
  }, [standardType])

  // Fetch standards for selected set
  useEffect(() => {
    const fetchStandards = async () => {
      if (!selectedSetId) return;
      
      try {
        setLoading(true)
        
        // Use the standards API endpoint for the selected set
        console.log(`Making standards request to: /api/standard_sets/${selectedSetId}/standards`);
        const response = await axios.get(`/api/standard_sets/${selectedSetId}/standards`, {
          params: { 
            page,
            page_size: 10
          }
        })
        
        if (response.data && response.data.entries && response.data.entries.length > 0) {
          console.log(`Received ${response.data.entries.length} standards from API`);
          setStandards(response.data.entries);
          setTotalPages(response.data.meta?.total_pages || 1);
          setError(null);
        } else {
          console.log('No standards found in API response');
          setError('No standards found for the selected criteria');
          setStandards([]);
        }
      } catch (err) {
        console.error('Error fetching standards:', err);
        setError('Failed to load standards. Please try a different standard set.');
        setStandards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStandards();
  }, [selectedSetId, page]);

  // Filter standards based on search term
  const filteredStandards = standards.filter(standard => 
    standard.learning_objective.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (standard.standard_code && standard.standard_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (standard.ngss_dci_name && standard.ngss_dci_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Handle standard launch
  const handleLaunchStandard = (standardId: string) => {
    setSelectedStandardId(standardId)
    setIsModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedStandardId(null)
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Handle standard set change
  const handleStandardSetChange = (setId: string) => {
    setSelectedSetId(setId)
    setPage(1) // Reset to first page when changing standard set
  }

  // Handle standard type change
  const handleStandardTypeChange = (type: 'NGSS' | 'CCSS') => {
    setStandardType(type)
    setSelectedSetId(null) // Reset selected set
    setPage(1) // Reset to first page
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Standard Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Standard Type</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleStandardTypeChange('NGSS')}
                className={`px-4 py-2 rounded-md flex-1 transition-colors duration-200 ${
                  standardType === 'NGSS' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                NGSS
              </button>
              <button
                onClick={() => handleStandardTypeChange('CCSS')}
                className={`px-4 py-2 rounded-md flex-1 transition-colors duration-200 ${
                  standardType === 'CCSS' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                CCSS
              </button>
            </div>
          </div>
          
          {/* Standard Set Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Standard Set</label>
            <select
              value={selectedSetId || ''}
              onChange={(e) => handleStandardSetChange(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Select a standard set</option>
              {standardSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name} - {set.subject_area}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search Standards</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by standard code or description..."
                className="block w-full rounded-md border-slate-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            <p>{error}</p>
          </div>
        )}
        
        {/* Standards Grid/List View */}
        {!loading && !error && filteredStandards.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-5'}>
            {filteredStandards.map((standard) => (
              <div 
                key={standard.id}
                className={`
                  ${viewMode === 'grid' 
                    ? 'bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1' 
                    : 'bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex'
                  }
                `}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="h-48 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                      {standard.image_key ? (
                        <Image 
                          src={`https://releases-cdn.legendsoflearning.com/legends/image/upload/c_fill,h_260,w_260/learning-objectives/${standard.image_key}`}
                          alt={standard.learning_objective}
                          width={260}
                          height={260}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-indigo-600 text-xl font-semibold">
                          {standard.standard_code || 'Standard'}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {standard.standard_code || 'Standard'}
                        </span>
                        {standard.question_count !== undefined && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {standard.question_count} Questions
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2 line-clamp-2">
                        {standard.ngss_dci_name || standard.learning_objective}
                      </h3>
                      <p className="text-sm text-slate-600 mb-5 truncate-3-lines">
                        {standard.learning_objective}
                      </p>
                      <button
                        onClick={() => handleLaunchStandard(standard.id.toString())}
                        className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                      >
                        Launch Standard
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-28 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                      <div className="text-indigo-600 text-xl font-semibold text-center">
                        {standard.standard_code || 'STD'}
                      </div>
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {standard.standard_code || 'Standard'}
                        </span>
                        {standard.question_count !== undefined && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {standard.question_count} Questions
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1.5 truncate">
                        {standard.ngss_dci_name || standard.learning_objective}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 truncate-2-lines">
                        {standard.learning_objective}
                      </p>
                      <button
                        onClick={() => handleLaunchStandard(standard.id.toString())}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                      >
                        Launch Standard
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!loading && !error && filteredStandards.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-lg border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-slate-900">No standards found</h3>
            <p className="mt-2 text-base text-slate-600 max-w-md mx-auto">
              Try changing your search criteria or selecting a different standard set.
            </p>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && filteredStandards.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-10">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium ${
                  page === 1 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === pageNum
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${
                  page === totalPages 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Launch Modal */}
      {isModalOpen && selectedStandardId && (
        <LaunchModal 
          contentId={selectedStandardId} 
          contentType="standard"
          onClose={handleCloseModal} 
        />
      )}
    </div>
  )
} 