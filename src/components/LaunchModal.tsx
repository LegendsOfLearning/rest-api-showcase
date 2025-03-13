import React, { useState, useEffect } from 'react';
import axios from 'axios';

type LaunchModalProps = {
  contentId?: string;
  standardId?: string;
  contentType?: 'standard' | 'content';
  onClose: () => void;
  standardSetId: string;
  standardName?: string;
  standardCode?: string;
};

type LaunchMode = 'redirect' | 'embed';

type Student = {
  id: string;
  firstName: string;
  lastName: string;
};

type Standard = {
  id: number;
  standard: string;
  standard_code?: string;
  ngss_dci_name?: string;
  grade_levels: string[];
  standard_set: string;
  school_level: string;
};

// Maximum number of retries for API calls
const MAX_RETRIES = 3;
// Base delay for exponential backoff (in ms)
const BASE_DELAY = 1000;

// Helper function for exponential backoff delay
const getBackoffDelay = (retryCount: number) => {
  return Math.min(BASE_DELAY * Math.pow(2, retryCount), 10000); // Cap at 10 seconds
};

// Helper function to check if error is a connection reset
const isConnectionReset = (error: any) => {
  return (
    error.response?.data?.error?.includes('Connection to the API server was reset') ||
    error.message?.includes('ECONNRESET') ||
    error.message?.includes('Network Error') ||
    error.code === 'ECONNRESET'
  );
};

// Helper function to make API call with retries
const makeApiCallWithRetry = async (apiCall: () => Promise<any>, retryCount = 0): Promise<any> => {
  try {
    return await apiCall();
  } catch (error: any) {
    if (isConnectionReset(error) && retryCount < MAX_RETRIES) {
      console.log(`Attempt ${retryCount + 1} failed, retrying in ${getBackoffDelay(retryCount)}ms...`);
      await new Promise(resolve => setTimeout(resolve, getBackoffDelay(retryCount)));
      return makeApiCallWithRetry(apiCall, retryCount + 1);
    }
    throw error;
  }
};

const LaunchModal: React.FC<LaunchModalProps> = ({ 
  contentId,
  standardId,
  contentType = 'standard',
  onClose,
  standardSetId,
  standardName,
  standardCode
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinUrls, setJoinUrls] = useState<Map<string, string>>(new Map());
  const [success, setSuccess] = useState(false);
  const [launchMode, setLaunchMode] = useState<LaunchMode>('redirect');
  const [showEmbed, setShowEmbed] = useState(false);
  const [students, setStudents] = useState<Student[]>([
    { id: 'demo-student-1', firstName: 'Demo', lastName: 'Student' }
  ]);
  const [newStudent, setNewStudent] = useState<Student>({ id: '', firstName: '', lastName: '' });
  
  // Add escape key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // Add keyboard shortcut for launching with Enter key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !loading && students.length > 0 && !success) {
        handleLaunch();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [loading, students.length, success]);

  const handleAddStudent = () => {
    if (newStudent.id && newStudent.firstName && newStudent.lastName) {
      setStudents([...students, { ...newStudent }]);
      setNewStudent({ id: '', firstName: '', lastName: '' });
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents(students.filter(student => student.id !== studentId));
  };
  
  const handleLaunch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the assignment with retries
      console.log(`Creating assignment for standard ID: ${standardId}`);
      const assignmentResponse = await makeApiCallWithRetry(() => 
        axios.post('/api/assignments', {
          type: 'standard',
          standard_id: standardId,
          application_user_id: 'demo-teacher-1'
        })
      );
      
      console.log('Assignment created:', assignmentResponse.data);
      const assignmentId = assignmentResponse.data.assignment_id;
      
      // Generate join URLs for all students
      const newJoinUrls = new Map<string, string>();
      
      for (const student of students) {
        try {
          console.log(`Creating join URL for student ${student.id}`);
          const joinResponse = await makeApiCallWithRetry(() => 
            axios.post(`/api/assignments/${assignmentId}/joins`, {
              application_user_id: student.id
            })
          );
          
          console.log(`Join URL created for ${student.id}:`, joinResponse.data);
          newJoinUrls.set(student.id, joinResponse.data.join_url);
        } catch (error) {
          console.error(`Failed to create join URL for student ${student.id}:`, error);
          // Continue with other students even if one fails
        }
      }
      
      setJoinUrls(newJoinUrls);
      setSuccess(true);
      
      // If embed mode is selected, show the iframe immediately
      if (launchMode === 'embed') {
        setShowEmbed(true);
      }
      
    } catch (error: any) {
      console.error('Error launching content:', error);
      
      // Provide more detailed error messages
      if (isConnectionReset(error)) {
        setError('Network connection issue. The request failed after multiple retries. Please check your internet connection and try again.');
      } else if (error.response?.status === 404) {
        setError(`${contentType} not found. Please check if the ID is correct.`);
      } else if (error.response?.status === 403) {
        setError('Permission denied. Please check your authentication credentials.');
      } else if (error.response?.status === 422) {
        setError(error.response.data?.error || 'Invalid request parameters. Please check your input.');
      } else {
        setError(error.response?.data?.error || error.message || 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-xl shadow-2xl ${
          launchMode === 'embed' && success ? 'w-[95vw] h-[90vh] max-w-none' : 'max-w-2xl w-full'
        } transform transition-all duration-200 ease-out`}
      >
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-200 rounded-t-xl flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Launch {contentType}</h3>
            {!success && (
              <p className="text-sm text-slate-500 mt-1">
                Add students and choose launch settings
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-150"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 max-h-[calc(90vh-4rem)] overflow-y-auto">
          {!success ? (
            <>
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                {contentType === 'standard' ? (
                  <>
                    {standardCode && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {standardCode}
                      </div>
                    )}
                    {standardName && (
                      <div className="text-sm text-slate-600 mt-2">
                        {standardName}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-600">
                    Launch {contentType} ID: {contentId}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Launch Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      className={`p-4 rounded-lg border-2 transition-all ${
                        launchMode === 'redirect' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setLaunchMode('redirect')}
                    >
                      <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Open in New Tab</span>
                      </div>
                    </button>
                    <button
                      className={`p-4 rounded-lg border-2 transition-all ${
                        launchMode === 'embed' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setLaunchMode('embed')}
                    >
                      <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        <span>Embed in Page</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Students
                    </label>
                    <span className="text-xs text-slate-500">
                      {students.length} student{students.length !== 1 ? 's' : ''} added
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4 p-2 border border-slate-200 rounded-lg">
                    {students.map((student) => (
                      <div 
                        key={student.id} 
                        className="group flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-slate-500">ID: {student.id}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 rounded-full hover:bg-red-50"
                          title="Remove student"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {students.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p>No students added yet</p>
                        <p className="text-xs text-slate-400">Add a student below to get started</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Add New Student</h4>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddStudent(); }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="student-id">
                            Student ID
                          </label>
                          <input
                            id="student-id"
                            type="text"
                            placeholder="Enter student ID"
                            value={newStudent.id}
                            onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="student-firstname">
                            First Name
                          </label>
                          <input
                            id="student-firstname"
                            type="text"
                            placeholder="Enter first name"
                            value={newStudent.firstName}
                            onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="student-lastname">
                            Last Name
                          </label>
                          <input
                            id="student-lastname"
                            type="text"
                            placeholder="Enter last name"
                            value={newStudent.lastName}
                            onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!newStudent.id || !newStudent.firstName || !newStudent.lastName}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Add Student</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Content successfully launched!</p>
                  </div>
                </div>
              </div>

              {launchMode === 'embed' ? (
                <div className="space-y-6">
                  {Array.from(joinUrls.entries()).map(([studentId, url]) => {
                    const student = students.find(s => s.id === studentId);
                    return (
                      <div key={studentId} className="bg-white rounded-lg shadow-sm">
                        <div className="p-4 border-b border-slate-200">
                          <h4 className="text-lg font-medium">{student?.firstName} {student?.lastName}</h4>
                        </div>
                        <div className="relative h-[calc(90vh-16rem)] w-full bg-slate-100 rounded-b-lg overflow-hidden">
                          <iframe
                            src={url}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(joinUrls.entries()).map(([studentId, url]) => {
                    const student = students.find(s => s.id === studentId);
                    return (
                      <div key={studentId} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                        <h4 className="font-medium mb-2">{student?.firstName} {student?.lastName}</h4>
                        <div className="bg-slate-50 p-3 rounded-md mb-3 overflow-auto group">
                          <div className="flex items-center justify-between">
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all text-sm"
                            >
                              {url}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(url);
                                // You might want to add a toast notification here
                              }}
                              className="ml-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-all"
                              title="Copy URL"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(url, '_blank')}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Open Content</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-200 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            {success ? 'Close' : 'Cancel'}
          </button>
          {!success && (
            <button
              onClick={handleLaunch}
              disabled={loading || students.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>Launch</span>
                  <kbd className="ml-2 inline-flex items-center rounded border border-slate-200 px-1.5 font-mono text-xs text-slate-400">⏎</kbd>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaunchModal;
