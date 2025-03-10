import { useState } from 'react'
import axios from 'axios'

export default function AssignmentCreator() {
  const [standardId, setStandardId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  const [joinUrl, setJoinUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!standardId || !teacherId) {
      setResult({
        success: false,
        message: 'Please fill in Standard ID and Teacher ID fields'
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)
      setJoinUrl(null)
      
      // First, ensure the teacher exists or create them
      try {
        await axios.post('/api/users', {
          application_user_id: teacherId,
          role: 'teacher',
          first_name: 'Demo',
          last_name: 'Teacher'
        })
      } catch (error: any) {
        // If error is not about user already existing with different params, rethrow
        if (!error.response?.data?.error?.includes('User already exists with different params')) {
          throw error
        }
        // Otherwise, we'll continue - the user exists but with different params
        console.log('Teacher already exists with different params, continuing...')
      }

      // Create the assignment
      const assignmentResponse = await axios.post('/api/assignments', {
        type: 'standard',
        standard_id: parseInt(standardId),
        application_user_id: teacherId
      })

      const assignmentId = assignmentResponse.data.assignment_id

      setResult({
        success: true,
        message: 'Assignment created successfully!',
        data: assignmentResponse.data
      })

      // If student ID is provided, create join URL
      if (studentId) {
        try {
          // Create student user if needed
          try {
            await axios.post('/api/users', {
              application_user_id: studentId,
              role: 'student',
              first_name: 'Demo',
              last_name: 'Student'
            })
          } catch (error: any) {
            // If error is not about user already existing with different params, rethrow
            if (!error.response?.data?.error?.includes('User already exists with different params')) {
              throw error
            }
            // Otherwise, we'll continue - the user exists but with different params
            console.log('Student already exists with different params, continuing...')
          }

          // Generate join URL
          const joinResponse = await axios.post(`/api/assignments/${assignmentId}/joins`, {
            application_user_id: studentId,
            target: 'awakening'
          })

          setJoinUrl(joinResponse.data.join_url)
        } catch (error: any) {
          console.error('Error generating join URL:', error)
          setResult({
            success: true,
            message: `Assignment created, but failed to generate join URL: ${error.response?.data?.error || error.message || 'Unknown error'}`
          })
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
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create Assignment</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standard ID
            <input
              type="text"
              value={standardId}
              onChange={(e) => setStandardId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter standard ID"
            />
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teacher ID
            <input
              type="text"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter Teacher ID"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student ID (optional, for join URL generation)
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter Student ID (optional)"
            />
          </label>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Assignment'
            )}
          </button>
        </div>
      </form>
      
      {result && (
        <div className={`mt-4 p-4 rounded-md ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                <strong>{result.success ? 'Success:' : 'Error:'}</strong> {result.message}
              </p>
              
              {result.success && result.data && (
                <div className="mt-2">
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {joinUrl && (
        <div className="mt-4 p-4 rounded-md bg-blue-50 text-blue-800">
          <h3 className="text-lg font-medium mb-2">Student Join URL</h3>
          <div className="bg-white p-3 rounded-md mb-3 overflow-auto">
            <a 
              href={joinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {joinUrl}
            </a>
          </div>
          <button
            onClick={() => window.open(joinUrl, '_blank')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Open Join URL
          </button>
        </div>
      )}
    </div>
  )
} 