import { useState } from 'react'
import axios from 'axios'

export default function AssignmentCreator() {
  const [standardId, setStandardId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [embedMode, setEmbedMode] = useState<boolean>(false)

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
      
      // Create the assignment with idempotent user creation
      console.log(`Creating assignment for standard ID: ${standardId}`)
      
      let assignmentResponse;
      try {
        assignmentResponse = await axios.post('/api/assignments', {
          type: 'standard',
          standard_id: parseInt(standardId),
          application_user_id: teacherId,
          teacher_first_name: 'Demo',
          teacher_last_name: 'Teacher'
        })
      } catch (error: any) {
        // Check if it's a connection reset error
        if (error.response?.data?.error?.includes('Connection to the API server was reset') || 
            error.message?.includes('ECONNRESET')) {
          console.log('Connection reset detected, retrying assignment creation...')
          // Wait a moment and retry once
          await new Promise(resolve => setTimeout(resolve, 2000))
          assignmentResponse = await axios.post('/api/assignments', {
            type: 'standard',
            standard_id: parseInt(standardId),
            application_user_id: teacherId,
            teacher_first_name: 'Demo',
            teacher_last_name: 'Teacher'
          })
        } else {
          throw error
        }
      }

      const assignmentId = assignmentResponse.data.assignment_id

      setResult({
        success: true,
        message: 'Assignment created successfully!',
        data: assignmentResponse.data
      })

      // If student ID is provided, create join URL
      if (studentId) {
        try {
          // Generate join URL with idempotent user creation
          console.log(`Creating join URL for assignment: ${assignmentId}`)
          
          let joinResponse;
          try {
            joinResponse = await axios.post(`/api/assignments/${assignmentId}/joins`, {
              application_user_id: studentId,
              student_first_name: 'Demo',
              student_last_name: 'Student',
              target: 'awakening'
            })
          } catch (error: any) {
            // Check if it's a connection reset error
            if (error.response?.data?.error?.includes('Connection to the API server was reset') || 
                error.message?.includes('ECONNRESET')) {
              console.log('Connection reset detected, retrying join URL creation...')
              // Wait a moment and retry once
              await new Promise(resolve => setTimeout(resolve, 2000))
              joinResponse = await axios.post(`/api/assignments/${assignmentId}/joins`, {
                application_user_id: studentId,
                student_first_name: 'Demo',
                student_last_name: 'Student',
                target: 'awakening'
              })
            } else {
              throw error
            }
          }

          setJoinUrl(joinResponse.data.join_url)
        } catch (error: any) {
          console.error('Error generating join URL:', error)
          
          // Provide a more user-friendly error message for connection issues
          if (error.message?.includes('Network Error') || 
              error.message?.includes('ECONNRESET') ||
              error.response?.data?.error?.includes('Connection')) {
            setResult({
              success: true,
              message: 'Assignment created, but there was a network issue when generating the join URL. Please try again.'
            })
          } else {
            setResult({
              success: true,
              message: `Assignment created, but failed to generate join URL: ${error.response?.data?.error || error.message || 'Unknown error'}`
            })
          }
        }
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      
      // Provide a more user-friendly error message for connection issues
      if (error.message?.includes('Network Error') || 
          error.message?.includes('ECONNRESET') ||
          error.response?.data?.error?.includes('Connection')) {
        setResult({
          success: false,
          message: 'Network connection issue. Please check your internet connection and try again.'
        })
      } else {
        setResult({
          success: false,
          message: `Error: ${error.response?.data?.error || error.message || 'Unknown error'}`
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-900">Create Assignment</h2>
        <p className="mt-1 text-sm text-slate-600">Assign content to students for testing purposes.</p>
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Standard ID
              <input
                type="text"
                value={standardId}
                onChange={(e) => setStandardId(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter standard ID"
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teacher ID
              <input
                type="text"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter Teacher ID"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Student ID (optional, for join URL generation)
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter Student ID (optional)"
              />
            </label>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
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

            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={embedMode}
                  onChange={(e) => setEmbedMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Show as embedded iframe</span>
              </label>
            </div>
            
            {embedMode ? (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Embed code:</p>
                <div className="bg-gray-100 p-3 rounded-md overflow-auto text-left">
                  <code className="text-xs text-gray-800">
                    {`<iframe src="${joinUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}
                  </code>
                </div>
                <div className="mt-4 p-4 border rounded-md">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <iframe 
                    src={joinUrl} 
                    width="100%" 
                    height="300" 
                    frameBorder="0" 
                    allowFullScreen
                    title="Legends of Learning Content"
                    className="border rounded"
                  ></iframe>
                </div>
              </div>
            ) : (
              <button
                onClick={() => window.open(joinUrl, '_blank')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Open Join URL
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 