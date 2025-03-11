import React, { useState } from 'react';
import axios from 'axios';

type LaunchModalProps = {
  contentId: string;
  contentType?: 'standard' | 'content';
  onClose: () => void;
};

const LaunchModal: React.FC<LaunchModalProps> = ({ 
  contentId,
  contentType = 'standard',
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleLaunch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the assignment with idempotent user creation
      console.log(`Creating assignment for standard ID: ${contentId}`);
      
      let assignmentResponse;
      try {
        assignmentResponse = await axios.post('/api/assignments', {
          type: 'standard',
          standard_id: parseInt(contentId),
          application_user_id: 'demo-teacher-1',
          teacher_first_name: 'Demo',
          teacher_last_name: 'Teacher'
        });
      } catch (error: any) {
        // Check if it's a connection reset error
        if (error.response?.data?.error?.includes('Connection to the API server was reset') || 
            error.message?.includes('ECONNRESET')) {
          console.log('Connection reset detected, retrying assignment creation...');
          // Wait a moment and retry once
          await new Promise(resolve => setTimeout(resolve, 2000));
          assignmentResponse = await axios.post('/api/assignments', {
            type: 'standard',
            standard_id: parseInt(contentId),
            application_user_id: 'demo-teacher-1',
            teacher_first_name: 'Demo',
            teacher_last_name: 'Teacher'
          });
        } else {
          throw error;
        }
      }
      
      console.log('Assignment created:', assignmentResponse.data);
      const assignmentId = assignmentResponse.data.assignment_id;
      
      // Generate join URL with idempotent user creation
      console.log(`Creating join URL for assignment: ${assignmentId}`);
      
      let joinResponse;
      try {
        joinResponse = await axios.post(`/api/assignments/${assignmentId}/joins`, {
          application_user_id: 'demo-student-1',
          student_first_name: 'Demo',
          student_last_name: 'Student',
          target: 'awakening'
        });
      } catch (error: any) {
        // Check if it's a connection reset error
        if (error.response?.data?.error?.includes('Connection to the API server was reset') || 
            error.message?.includes('ECONNRESET')) {
          console.log('Connection reset detected, retrying join URL creation...');
          // Wait a moment and retry once
          await new Promise(resolve => setTimeout(resolve, 2000));
          joinResponse = await axios.post(`/api/assignments/${assignmentId}/joins`, {
            application_user_id: 'demo-student-1',
            student_first_name: 'Demo',
            student_last_name: 'Student',
            target: 'awakening'
          });
        } else {
          throw error;
        }
      }
      
      console.log('Join URL created:', joinResponse.data);
      setJoinUrl(joinResponse.data.join_url);
      setSuccess(true);
      
    } catch (error: any) {
      console.error('Error launching content:', error);
      
      // Provide a more user-friendly error message for connection issues
      if (error.message?.includes('Network Error') || 
          error.message?.includes('ECONNRESET') ||
          error.response?.data?.error?.includes('Connection')) {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else {
        setError(error.response?.data?.error || error.message || 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const openJoinUrl = () => {
    if (joinUrl) {
      window.open(joinUrl, '_blank');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
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
            <p className="text-slate-600 mb-4">
              Launch {contentType} ID: {contentId} in the Legends of Learning platform.
            </p>
            
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
                disabled={loading}
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
            
            <div className="mb-6">
              <p className="text-slate-600 mb-2">Your content is ready to be launched. Click the button below to open it in a new tab.</p>
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-sm font-mono text-slate-700 break-all">
                {joinUrl}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                Close
              </button>
              <button
                onClick={openJoinUrl}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Open Content
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LaunchModal;
