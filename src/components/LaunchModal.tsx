import React, { useState, useEffect } from 'react';
import axios from 'axios';

type LaunchModalProps = {
  contentId: string;
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
  learning_objective: string;
  standard_code?: string;
  ngss_dci_name?: string;
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
      console.log(`Creating assignment for standard ID: ${contentId}`);
      const assignmentResponse = await makeApiCallWithRetry(() => 
        axios.post('/api/assignments', {
          type: 'standard',
          standard_id: parseInt(contentId),
          application_user_id: 'demo-teacher-1',
          teacher_first_name: 'Demo',
          teacher_last_name: 'Teacher'
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
              application_user_id: student.id,
              student_first_name: student.firstName,
              student_last_name: student.lastName,
              target: 'awakening'
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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl p-6 shadow-xl ${launchMode === 'embed' && success ? 'w-[95vw] h-[90vh] max-w-none' : 'max-w-lg w-full'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-900">Launch {contentType}</h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {!success ? (
          <>
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              {contentType === 'standard' ? (
                <>
                  {standardCode && (
                    <div className="text-sm font-medium text-indigo-600">
                      {standardCode}
                    </div>
                  )}
                  {standardName && (
                    <div className="text-sm text-slate-600 mt-1">
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Launch Mode
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600"
                    name="launchMode"
                    value="redirect"
                    checked={launchMode === 'redirect'}
                    onChange={(e) => setLaunchMode(e.target.value as LaunchMode)}
                  />
                  <span className="ml-2">Open in New Tab</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600"
                    name="launchMode"
                    value="embed"
                    checked={launchMode === 'embed'}
                    onChange={(e) => setLaunchMode(e.target.value as LaunchMode)}
                  />
                  <span className="ml-2">Embed in Page</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Students
              </label>
              <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4 p-2 border border-slate-200 rounded-lg">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                      <div className="text-sm text-slate-500">ID: {student.id}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                      title="Remove student"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                {students.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No students added yet. Add a student below.
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Add New Student</h4>
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
                <div className="mt-4">
                  <button
                    onClick={handleAddStudent}
                    disabled={!newStudent.id || !newStudent.firstName || !newStudent.lastName}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Add Student</span>
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleLaunch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
                disabled={loading || students.length === 0}
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
                  'Launch'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">Content ready to launch!</p>
                </div>
              </div>
            </div>

            {launchMode === 'embed' ? (
              <div className="flex-1 h-full">
                {showEmbed && joinUrls.size > 0 && (
                  <div className="space-y-4">
                    {Array.from(joinUrls.entries()).map(([studentId, url]) => {
                      const student = students.find(s => s.id === studentId);
                      return (
                        <div key={studentId} className="relative">
                          <h4 className="text-lg font-medium mb-2">{student?.firstName} {student?.lastName}</h4>
                          <div className="relative h-[calc(90vh-8rem)] w-full bg-slate-100 rounded-lg overflow-hidden">
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
                )}
              </div>
            ) : (
              <div className="mb-6 space-y-4">
                {Array.from(joinUrls.entries()).map(([studentId, url]) => {
                  const student = students.find(s => s.id === studentId);
                  return (
                    <div key={studentId} className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium mb-2">{student?.firstName} {student?.lastName}</h4>
                      <div className="bg-white p-3 rounded-md mb-3 overflow-auto">
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {url}
                        </a>
                      </div>
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        Open Content
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LaunchModal;
