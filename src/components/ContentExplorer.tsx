'use client';

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import LaunchModal from './LaunchModal'
import Image from 'next/image'
import SubjectSelector from './SubjectSelector'

type Content = {
  id: number
  game: string
  image: string
  description: string
  estimated_duration: number
  type: string
  content_type: string
  supports_ipad: boolean
  supports_tts: boolean
  video_preview_url?: string
  version: {
    id: number
    url: string
    language_key: string
    api_version: string
  }
  grade_levels: string[]
  stats: {
    teacher_rating_avg: number
    teacher_rating_count: number
    student_rating_avg: number
    student_rating_count: number
    ease_of_play_avg: number
    content_integration_avg: number
    composite_rating_score: number
    composite_rating_avg: number
    suggested_use_summary: string
  }
}

type StandardSet = {
  id: string
  name: string
  subject_area: string
  grade_level?: string
  public?: boolean
}

type GradeLevel = 'K' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
type ContentType = 'instructional' | 'question' | 'simulation' | 'video'

type ContentExplorerProps = {
  subject: string;
  standardSet?: string | null;
}

export default function ContentExplorer({ subject = 'math', standardSet }: ContentExplorerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<GradeLevel[]>([])
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null)
  const [standardSets, setStandardSets] = useState<StandardSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(standardSet || null)
  
  // Constants
  const gradeOptions: GradeLevel[] = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const contentTypeOptions: { value: ContentType; label: string }[] = [
    { value: 'instructional', label: 'Instructional' },
    { value: 'question', label: 'Question' },
    { value: 'simulation', label: 'Simulation' },
    { value: 'video', label: 'Video' }
  ]
  
  // Initialize from URL params
  useEffect(() => {
    const gradesParam = searchParams.get('grades')
    if (gradesParam) {
      const grades = gradesParam.split(',') as GradeLevel[]
      setSelectedGrades(grades)
    }
    
    const typesParam = searchParams.get('types')
    if (typesParam) {
      const types = typesParam.split(',') as ContentType[]
      setSelectedContentTypes(types)
    }
    
    const searchParam = searchParams.get('search')
    if (searchParam) {
      setSearchTerm(searchParam)
    }
  }, [searchParams])
  
  // Fetch standard sets
  useEffect(() => {
    const fetchStandardSets = async () => {
      try {
        setLoading(true)
        // Use the standard_sets API endpoint
        const response = await axios.get('/api/standard_sets', {
          params: {
            per_page: 1000
          }
        })
        
        if (response.data && response.data.results) {
          // Filter by subject area
          const filteredSets = response.data.results.filter((set: StandardSet) => 
            set.subject_area.toLowerCase() === subject.toLowerCase()
          )
          
          setStandardSets(filteredSets)
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
  
  // Fetch content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build query parameters
        const params = new URLSearchParams()
        
        if (selectedGrades.length > 0) {
          params.append('grades', selectedGrades.join(','))
        }
        
        if (selectedContentTypes.length > 0) {
          params.append('type', selectedContentTypes[0]) // API only supports single type
        }
        
        if (searchTerm) {
          params.append('query', searchTerm)
        }
        
        params.append('subject', subject)
        if (selectedSetId) {
          params.append('standard_set', selectedSetId)
        }
        params.append('page', '1')
        params.append('per_page', '50') // Get more items for better filtering
        
        // Make API request
        const response = await axios.get(`/api/content?${params.toString()}`)
        
        if (response.data && response.data.entries) {
          setContent(response.data.entries)
        } else {
          setError('Invalid response format')
        }
      } catch (err: any) {
        setError('Failed to fetch content. Please try again.')
        console.error('Error fetching content:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContent()
  }, [selectedGrades, selectedContentTypes, searchTerm, subject, selectedSetId])
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (selectedGrades.length > 0) {
      params.append('grades', selectedGrades.join(','))
    }
    
    if (selectedContentTypes.length > 0) {
      params.append('types', selectedContentTypes.join(','))
    }
    
    if (searchTerm) {
      params.append('search', searchTerm)
    }
    
    const newUrl = `?${params.toString()}`
    router.push(newUrl, { scroll: false })
  }, [selectedGrades, selectedContentTypes, searchTerm, router])
  
  // Handle grade selection
  const handleGradeChange = (grade: GradeLevel) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade))
    } else {
      setSelectedGrades([...selectedGrades, grade])
    }
  }
  
  // Handle content type selection
  const handleContentTypeChange = (type: ContentType) => {
    if (selectedContentTypes.includes(type)) {
      setSelectedContentTypes(selectedContentTypes.filter(t => t !== type))
    } else {
      setSelectedContentTypes([...selectedContentTypes, type])
    }
  }
  
  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }
  
  // Handle content launch
  const handleLaunch = (contentId: number) => {
    setSelectedContentId(contentId)
    setIsModalOpen(true)
  }
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedContentId(null)
  }
  
  // Handle standard set change
  const handleStandardSetChange = (setId: string) => {
    setSelectedSetId(setId)
    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    if (setId) {
      params.set('standard_set', setId)
    } else {
      params.delete('standard_set')
    }
    router.push(`/content?${params.toString()}`)
  }
  
  // Filter content based on search term
  const filteredContent = content.filter(item => 
    item.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Content Search</h1>
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        {/* Subject Area */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Subject Area</h2>
          <SubjectSelector 
            currentSubject={subject} 
            onSubjectChange={(newSubject) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('subject', newSubject);
              router.push(`/content?${params.toString()}`);
            }}
          />
        </div>

        {/* Standard Set Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Standard Set</h2>
          <select
            value={selectedSetId || ''}
            onChange={(e) => handleStandardSetChange(e.target.value)}
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Standard Sets</option>
            {standardSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Search</h2>
          <input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Grade Levels</h2>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map(grade => (
                <button
                  key={grade}
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
          
          <div>
            <h2 className="text-lg font-semibold mb-3">Content Types</h2>
            <div className="flex flex-wrap gap-2">
              {contentTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleContentTypeChange(option.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedContentTypes.includes(option.value)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* Content Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.game} 
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{item.game}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-3">{item.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.type}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.estimated_duration} min
                  </span>
                </div>
                <button
                  onClick={() => handleLaunch(item.id)}
                  className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Launch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Launch Modal */}
      {isModalOpen && selectedContentId && (
        <LaunchModal 
          contentId={selectedContentId.toString()} 
          contentType="content"
          onClose={closeModal} 
          standardSetId={selectedSetId || ''}
        />
      )}
    </div>
  )
} 