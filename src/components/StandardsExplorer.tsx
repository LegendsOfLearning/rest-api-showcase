import { useState, useEffect } from 'react'
import axios from 'axios'
import LaunchModal from './LaunchModal'

type Standard = {
  id: number
  subject: {
    id: number
    name: string
    grade_level: string
    subject_area: string
  }
  learning_objective: string
  image_key: string
  grades: { grade: number }[]
  image_url: string
  standard_code: string
}

type StandardSet = {
  id: string
  name: string
  subject_area: string
}

type StandardsExplorerProps = {
  standardSet?: string
}

export default function StandardsExplorer({ standardSet = 'ccss' }: StandardsExplorerProps) {
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

  // Fetch standard sets
  useEffect(() => {
    const fetchStandardSets = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/standard_sets')
        
        // Filter for NGSS or CCSS based on standardType
        const filteredSets = response.data.results.filter((set: StandardSet) => 
          set.name.includes(standardType)
        )
        
        setStandardSets(filteredSets)
        setError(null)
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
  const fetchStandards = async () => {
    try {
      setLoading(true)
      
      // Use the standardSet prop to filter standards
      const params: Record<string, any> = { 
        page,
        standard_set: standardSet
      }
      
      const response = await axios.get('/api/standard_sets', { params })
      
      setStandards(response.data.entries || [])
      setTotalPages(response.data.total_pages || 1)
      setError(null)
    } catch (err) {
      console.error('Error fetching standards:', err)
      setError('Failed to load standards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStandards()
  }, [page, standardSet])

  // Filter standards based on search term
  const filteredStandards = standards.filter(standard => 
    standard.learning_objective.toLowerCase().includes(searchTerm.toLowerCase()) || 
    standard.standard_code.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Standards Explorer</h2>
      
      {/* Standard Type Selector */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setStandardType('NGSS')}
            className={`px-4 py-2 rounded-md ${
              standardType === 'NGSS' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            NGSS
          </button>
          <button
            onClick={() => setStandardType('CCSS')}
            className={`px-4 py-2 rounded-md ${
              standardType === 'CCSS' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            CCSS
          </button>
        </div>
      </div>
      
      {/* Standard Sets Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Standard Set
          <select
            value={selectedSetId || ''}
            onChange={(e) => setSelectedSetId(e.target.value || null)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a standard set</option>
            {standardSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      
      {/* Search Input */}
      {selectedSetId && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Standards
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search by name or description..."
            />
          </label>
        </div>
      )}
      
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
      
      {/* Standards List */}
      {selectedSetId && !loading && !error && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Standards ({filteredStandards.length})
          </h3>
          
          {filteredStandards.length === 0 ? (
            <p className="text-gray-500 italic">No standards found matching your search.</p>
          ) : (
            <div className="space-y-4">
              {filteredStandards.map((standard) => (
                <div key={standard.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                  <h4 className="font-medium text-gray-800">{standard.learning_objective}</h4>
                  <p className="text-sm text-gray-600 mt-1">{standard.standard_code}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {standard.subject.subject_area}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {standard.subject.grade_level}
                    </span>
                  </div>
                  <div className="mt-3">
                    <button 
                      onClick={() => handleLaunchStandard(standard.id.toString())}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Create Assignment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Launch Modal */}
      <LaunchModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        standardId={selectedStandardId || undefined}
      />
    </div>
  )
} 