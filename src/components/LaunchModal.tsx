import { useState } from 'react'
import axios from 'axios'

type LaunchModalProps = {
  isOpen: boolean
  onClose: () => void
  gameId?: string
  standardId?: string
}

export default function LaunchModal({ isOpen, onClose, gameId, standardId }: LaunchModalProps) {
  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [embedMode, setEmbedMode] = useState<boolean>(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teacherId || !studentId) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // 1. Check if teacher exists first, then create if needed
      try {
        // Try to create teacher user
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

      // 2. Check if student exists first, then create if needed
      try {
        // Try to create student user
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

      // 3. Create assignment
      const assignmentResponse = await axios.post('/api/assignments', {
        type: 'standard',
        standard_id: standardId,
        application_user_id: teacherId
      })

      const assignmentId = assignmentResponse.data.assignment_id

      // 4. Create join URL
      const joinResponse = await axios.post(`/api/assignments/${assignmentId}/joins`, {
        application_user_id: studentId,
        target: 'awakening'
      })

      setJoinUrl(joinResponse.data.join_url)
      setStep('result')
    } catch (err: any) {
      console.error('Error launching standard:', err)
      setError(`Error: ${err.response?.data?.error || err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTeacherId('')
    setStudentId('')
    setJoinUrl(null)
    setError(null)
    setStep('form')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Launch Standard
                </h3>
                
                {step === 'form' ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teacher ID
                        <input
                          type="text"
                          value={teacherId}
                          onChange={(e) => setTeacherId(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter teacher ID"
                        />
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student ID
                        <input
                          type="text"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter student ID"
                        />
                      </label>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4">
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
                  </form>
                ) : (
                  <div>
                    {joinUrl ? (
                      <div className="text-center">
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-700">
                                Standard launched successfully!
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <p className="mb-4 text-gray-600">
                          Use the link below to join the standard:
                        </p>
                        
                        <div className="bg-gray-100 p-3 rounded-md mb-4 overflow-auto">
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
                            type="button"
                            onClick={() => window.open(joinUrl, '_blank')}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Open Standard
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">
                              Failed to generate join URL.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {step === 'form' ? (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Launching...
                    </>
                  ) : (
                    'Launch Standard'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Launch Another Standard
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 