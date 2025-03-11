import { useState, useEffect } from 'react'
import axios from 'axios'

type StandardSet = {
  id: string
  name: string
  subject_area: string
}

type Standard = {
  id: number
  standard_code: string
  learning_objective: string
}

type User = {
  id: number
  application_user_id: string
  first_name: string
  last_name: string
  role: 'teacher' | 'student'
}

export default function AssignmentCreator() {
  // State for standard sets and standards
  const [standardSets, setStandardSets] = useState<StandardSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [standards, setStandards] = useState<Standard[]>([])
  const [selectedStandardId, setSelectedStandardId] = useState<string>('')
  
  // State for users
  const [teachers, setTeachers] = useState<User[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  
  // State for join options
  const [createLinksNow, setCreateLinksNow] = useState<boolean>(true)
  const [displayType, setDisplayType] = useState<'embed' | 'redirect'>('redirect')
  const [useAwakening, setUseAwakening] = useState<boolean>(true)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  const [joinUrls, setJoinUrls] = useState<Map<string, string>>(new Map())

  // Fetch standard sets
  useEffect(() => {
    const fetchStandardSets = async () => {
      try {
        const response = await axios.get('/api/standard_sets', {
          params: { per_page: 1000 }
        })
        if (response.data && response.data.results) {
          setStandardSets(response.data.results)
        }
      } catch (error) {
        console.error('Error fetching standard sets:', error)
        setError(error instanceof Error ? error.message : 'Error fetching standard sets')
      }
    }
    fetchStandardSets()
  }, [])

  // Fetch standards when standard set is selected
  useEffect(() => {
    const fetchStandards = async () => {
      if (!selectedSetId) {
        setStandards([])
        return
      }
      
      try {
        const response = await axios.get(`/api/standard_sets/${selectedSetId}/standards`)
        if (response.data && response.data.results) {
          setStandards(response.data.results)
        }
      } catch (error) {
        console.error('Error fetching standards:', error)
        setError(error instanceof Error ? error.message : 'Error fetching standards')
      }
    }
    fetchStandards()
  }, [selectedSetId])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch teachers
        const teachersResponse = await axios.get('/api/users', {
          params: { role: 'teacher' }
        })
        if (teachersResponse.data?.users) {
          setTeachers(teachersResponse.data.users)
        }

        // Fetch students
        const studentsResponse = await axios.get('/api/users', {
          params: { role: 'student' }
        })
        if (studentsResponse.data?.users) {
          setStudents(studentsResponse.data.users)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setError(error instanceof Error ? error.message : 'Error fetching users')
      }
    }
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStandardId || !selectedTeacherId || (createLinksNow && selectedStudentIds.length === 0)) {
      setResult({
        success: false,
        message: 'Please fill in all required fields' + (createLinksNow ? ' and select at least one student' : '')
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)
      setJoinUrls(new Map())
      
      // Get dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      const selectedTeacher = teachers.find(t => t.application_user_id === selectedTeacherId)

      // Create the assignment
      const assignmentResponse = await axios.post('/api/assignments', {
        type: 'standard',
        standard_id: parseInt(selectedStandardId),
        application_user_id: selectedTeacherId,
        teacher_first_name: selectedTeacher?.first_name || 'Demo',
        teacher_last_name: selectedTeacher?.last_name || 'Teacher',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })

      const assignmentId = assignmentResponse.data.assignment_id

      setResult({
        success: true,
        message: 'Assignment created successfully!'
      })

      // Generate join URLs if auto-join is enabled
      if (createLinksNow && selectedStudentIds.length > 0) {
        const newJoinUrls = new Map<string, string>()
        
        for (const studentId of selectedStudentIds) {
          try {
            const student = students.find(s => s.application_user_id === studentId)
            if (!student) continue

            const joinResponse = await axios.post(`/api/assignments/${assignmentId}/joins`, {
              application_user_id: studentId,
              student_first_name: student.first_name,
              student_last_name: student.last_name,
              target: useAwakening ? 'awakening' : 'classic'
            })
            
            if (joinResponse.data?.join_url) {
              newJoinUrls.set(studentId, joinResponse.data.join_url)
            }
          } catch (error) {
            console.error(`Error generating join URL for student ${studentId}:`, error)
          }
        }
        
        setJoinUrls(newJoinUrls)

        // If we have URLs and redirect is selected, open the first one in a new tab
        if (newJoinUrls.size > 0 && displayType === 'redirect' && typeof window !== 'undefined') {
          const firstUrl = Array.from(newJoinUrls.values())[0]
          window.open(firstUrl, '_blank')
        }
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      setResult({
        success: false,
        message: `Error: ${error.response?.data?.error || error.message || 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-900">Create Assignment</h2>
        <p className="mt-1 text-sm text-slate-600">Create and assign content to students.</p>
      </div>
      
      <div className="p-6">
        {result && (
          <div className={`mb-6 ${
            result.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
          } px-4 py-3 rounded-lg`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Standards Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-4">Standards Selection</h4>
            <div className="space-y-4">
              {/* Standard Set Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Standard Set
                  <select
                    value={selectedSetId}
                    onChange={(e) => {
                      setSelectedSetId(e.target.value)
                      setSelectedStandardId('')
                    }}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
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

              {/* Standard Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Standard
                  <select
                    value={selectedStandardId}
                    onChange={(e) => setSelectedStandardId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                    disabled={!selectedSetId}
                  >
                    <option value="">
                      {selectedSetId ? 'Select a standard' : 'First select a standard set'}
                    </option>
                    {standards.map((standard) => (
                      <option key={standard.id} value={standard.id}>
                        {standard.standard_code} - {standard.learning_objective}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Teacher Selection */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-4">Teacher</h4>
            <div>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.application_user_id} value={teacher.application_user_id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment Options */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-4">Assignment Options</h4>
            <div className="space-y-4">
              {/* Assignment Dates - Display Only */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">
                    Start: <span className="font-medium">Now</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    End: <span className="font-medium">7 days from now</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="redirect"
                      checked={displayType === 'redirect'}
                      onChange={(e) => setDisplayType(e.target.value as 'embed' | 'redirect')}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-slate-700">Redirect</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="embed"
                      checked={displayType === 'embed'}
                      onChange={(e) => setDisplayType(e.target.value as 'embed' | 'redirect')}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-slate-700">Embed</span>
                  </label>
                </div>

                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={useAwakening}
                    onChange={(e) => setUseAwakening(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2 text-sm text-slate-700">Use Awakening (recommended)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Join Options */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-4">Join Options</h4>
            <div className="space-y-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={createLinksNow}
                  onChange={(e) => setCreateLinksNow(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-sm text-slate-700">Create join links now</span>
              </label>

              {createLinksNow && (
                <div>
                  {/* Student Selection - Only shown when creating join links */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Students
                    </label>
                    <select
                      multiple
                      value={selectedStudentIds}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions)
                        setSelectedStudentIds(options.map(option => option.value))
                      }}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required={createLinksNow}
                      size={5}
                    >
                      {students.length === 0 ? (
                        <option disabled>Loading students...</option>
                      ) : (
                        students.map((student) => (
                          <option key={student.application_user_id} value={student.application_user_id}>
                            {student.first_name} {student.last_name}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple students</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Assignment...
                </span>
              ) : (
                'Create Assignment'
              )}
            </button>
          </div>
        </form>
        
        {/* Join URLs Display */}
        {joinUrls.size > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Assignment URLs</h3>
            <div className="space-y-4">
              {Array.from(joinUrls.entries()).map(([studentId, url]) => {
                const student = students.find(s => s.application_user_id === studentId)
                return (
                  <div key={studentId} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-900">
                        {student ? `${student.first_name} ${student.last_name}` : studentId}
                      </h4>
                      <button
                        type="button"
                        onClick={() => typeof window !== 'undefined' && window.open(url, '_blank')}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Open
                      </button>
                    </div>
                    
                    {displayType === 'embed' && (
                      <div className="mt-2">
                        <p className="text-sm text-slate-600 mb-1">Embed code:</p>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <code className="text-xs text-slate-800 break-all">
                            {`<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 