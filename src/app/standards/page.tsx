'use client';

import { useState, useEffect } from 'react';
import { User, StandardSet, Standard } from '@/types/api';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export default function StandardsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [standardSets, setStandardSets] = useState<StandardSet[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinUrls, setJoinUrls] = useState<Array<{ studentId: string, url: string }>>([]);

  // Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(API_ENDPOINTS.USERS);
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        
        // Split users into students and teachers
        const students = data.filter((user: User) => user.role === 'student');
        const teachers = data.filter((user: User) => user.role === 'teacher');
        
        if (teachers.length === 0) {
          throw new Error('No teachers found');
        }
        
        setStudents(students);
        setTeachers(teachers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      }
    }
    fetchUsers();
  }, []);

  // Fetch standard sets on mount
  useEffect(() => {
    async function fetchStandardSets() {
      try {
        const response = await fetch(API_ENDPOINTS.STANDARD_SETS);
        const data = await response.json();
        if (!data?.results) {
          throw new Error('Invalid response format');
        }
        setStandardSets(data.results);
      } catch (error) {
        console.error('Error fetching standard sets:', error);
        setError('Failed to load standard sets');
      }
    }
    fetchStandardSets();
  }, []);

  // Fetch standards when a set is selected
  useEffect(() => {
    async function fetchStandards() {
      if (!selectedSet) {
        setStandards([]);
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.STANDARDS(selectedSet));
        const data = await response.json();
        if (!data?.entries) {
          throw new Error('Invalid response format');
        }
        // Sort standards alphabetically by standard text
        const sortedStandards = [...data.entries].sort((a, b) => 
          a.standard.localeCompare(b.standard)
        );
        setStandards(sortedStandards);
      } catch (error) {
        console.error('Error fetching standards:', error);
        setError('Failed to load standards');
      }
    }
    fetchStandards();
  }, [selectedSet]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSetChange = (setId: string) => {
    setSelectedSet(setId);
    setSelectedStandard(null);
  };

  const handleStandardSelect = (standard: Standard) => {
    setSelectedStandard(standard);
  };

  const handleLaunch = async () => {
    if (!selectedStandard || selectedStudents.length === 0 || !selectedTeacher) {
      setError('Please select a teacher, standard, and at least one student');
      return;
    }

    setLoading(true);
    setError(null);
    setJoinUrls([]); // Clear previous join URLs

    try {
      // Create one assignment with the selected teacher
      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'standard',
          standard_id: selectedStandard.id,
          application_user_id: selectedTeacher.application_user_id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Launch failed');
      }

      const data = await response.json();
      if (!data?.assignment_id) {
        throw new Error('Invalid response format');
      }

      // Get join URLs for all students
      const joinPromises = selectedStudents.map(async studentId => {
        const join = API_ENDPOINTS.ASSIGNMENT_JOIN(data.assignment_id, studentId);
        const joinResponse = await fetch(join.url, {
          method: join.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(join.body)
        });
        
        if (!joinResponse.ok) {
          throw new Error(`Failed to get join URL for student ${studentId}`);
        }
        
        const joinData = await joinResponse.json();
        return {
          studentId,
          url: joinData.join_url
        };
      });

      const results = await Promise.all(joinPromises);
      setJoinUrls(results);
      console.log('Launch successful:', results);
      
    } catch (error) {
      console.error('Launch error:', error);
      setError('Failed to launch standard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Launch Standards</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Join URLs Display */}
        {joinUrls.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg mb-8 overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-100">
              <h3 className="text-lg font-medium text-green-800">Join URLs</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {joinUrls.map(({ studentId, url }) => {
                const student = students.find(s => s.application_user_id === studentId);
                return (
                  <div key={studentId} className="px-6 py-4 flex items-center justify-between">
                    <div className="font-medium text-gray-900">
                      {student ? `${student.first_name} ${student.last_name}` : studentId}
                    </div>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Join Link
                      <svg className="ml-2 -mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Teacher Selection */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Select Teacher</h2>
            </div>
            <div className="px-6 py-4 divide-y divide-gray-200">
              {teachers.map(teacher => (
                <div key={teacher.id} className="py-3 first:pt-0 last:pb-0">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      id={`teacher-${teacher.application_user_id}`}
                      name="teacher"
                      checked={selectedTeacher?.application_user_id === teacher.application_user_id}
                      onChange={() => setSelectedTeacher(teacher)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="flex-grow text-gray-900">
                      {teacher.first_name} {teacher.last_name}
                      <span className="text-sm text-gray-500 ml-2">
                        ID: {teacher.application_user_id}
                      </span>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Students Selection */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Select Students</h2>
              </div>
              <div className="px-6 py-4">
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
                  {students.map(student => (
                    <div key={student.id} className="py-3 first:pt-0">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          id={student.application_user_id}
                          checked={selectedStudents.includes(student.application_user_id)}
                          onChange={() => handleStudentToggle(student.application_user_id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-900">{student.first_name} {student.last_name}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Standards Selection */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Select Standard</h2>
              </div>
              <div className="p-6 space-y-4">
                <select
                  value={selectedSet || ''}
                  onChange={(e) => handleSetChange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  <option value="">Select a Standard Set</option>
                  {standardSets.map(set => (
                    <option key={set.id} value={set.id}>
                      {set.name}
                    </option>
                  ))}
                </select>

                {selectedSet && (
                  <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto divide-y divide-gray-200">
                    {standards.map(standard => (
                      <div
                        key={standard.id}
                        onClick={() => handleStandardSelect(standard)}
                        className={`p-3 cursor-pointer transition-colors duration-150 ${
                          selectedStandard?.id === standard.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        {standard.standard}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <div className="flex justify-end">
            <button
              onClick={handleLaunch}
              disabled={!selectedStandard || selectedStudents.length === 0 || loading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
                !selectedStandard || selectedStudents.length === 0 || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Launching...
                </>
              ) : (
                'Launch Standard'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 