import { useState, useEffect } from 'react'
import axios from 'axios'
import LaunchModal from './LaunchModal'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import SubjectSelector from './SubjectSelector'

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
  subject: string
}

export default function StandardsExplorer({ standardSet = 'ngss', subject }: StandardsExplorerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [standardSets, setStandardSets] = useState<StandardSet[]>([])
  const [standards, setStandards] = useState<Standard[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(() => {
    // Initialize from localStorage if available, filtered by subject
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedStandardSet')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.subject === subject) {
            return parsed.setId
          }
        } catch (e) {
          console.error('Error parsing stored standard set:', e)
        }
      }
    }
    return null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null)
  const [selectedStandardName, setSelectedStandardName] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch standard sets
  useEffect(() => {
    const fetchStandardSets = async () => {
      try {
        setLoading(true)
        // Use the standard_sets API endpoint
        const response = await axios.get('/api/standard_sets', {
          params: {
            per_page: 1000 // Use per_page instead of page_size
          }
        })
        
        if (response.data && response.data.results) {
          // Filter by subject area
          const filteredSets = response.data.results.filter((set: StandardSet) => 
            set.subject_area.toLowerCase() === subject.toLowerCase()
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
  }, [subject])

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

  // Handle standard launch
  const handleLaunchStandard = (standard: Standard) => {
    setSelectedStandardId(standard.id.toString())
    setSelectedStandardName(standard.ngss_dci_name || standard.learning_objective)
    setIsModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedStandardId(null)
    setSelectedStandardName(null)
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
    // Store in localStorage with subject
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedStandardSet', JSON.stringify({ setId, subject }))
    }
    setPage(1) // Reset to first page when changing standard set
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
        <div className="grid grid-cols-1 gap-6">
          {/* Subject Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject Area</label>
            <SubjectSelector 
              currentSubject={subject} 
              standardSets
              onSubjectChange={(newSubject) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('subject', newSubject);
                router.push(`/standards?${params.toString()}`);
              }}
            />
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
                  {set.name}
                </option>
              ))}
            </select>
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
        {!loading && !error && standards.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-5'}>
            {standards.map((standard) => (
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
                        onClick={() => handleLaunchStandard(standard)}
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
                        onClick={() => handleLaunchStandard(standard)}
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
        {!loading && !error && standards.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-lg border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-slate-900">No standards found</h3>
            <p className="mt-2 text-base text-slate-600 max-w-md mx-auto">
              Try selecting a different standard set.
            </p>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && standards.length > 0 && totalPages > 1 && (
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
              {(() => {
                const pageNumbers = [];
                const maxVisible = 5; // Maximum number of visible page numbers
                const halfVisible = Math.floor(maxVisible / 2);
                
                let startPage = Math.max(1, page - halfVisible);
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                
                // Adjust start if we're near the end
                if (endPage === totalPages) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                
                // Add first page
                if (startPage > 1) {
                  pageNumbers.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      1
                    </button>
                  );
                  
                  // Add ellipsis if there's a gap
                  if (startPage > 2) {
                    pageNumbers.push(
                      <span key="start-ellipsis" className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-slate-300 text-slate-600">
                        ...
                      </span>
                    );
                  }
                }
                
                // Add visible page numbers
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === i
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                
                // Add last page
                if (endPage < totalPages) {
                  // Add ellipsis if there's a gap
                  if (endPage < totalPages - 1) {
                    pageNumbers.push(
                      <span key="end-ellipsis" className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-slate-300 text-slate-600">
                        ...
                      </span>
                    );
                  }
                  
                  pageNumbers.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pageNumbers;
              })()}
              
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
          standardSetId={selectedSetId || ''}
          standardName={selectedStandardName || undefined}
          standardCode={standards.find(s => s.id.toString() === selectedStandardId)?.standard_code}
        />
      )}
    </div>
  )
} 