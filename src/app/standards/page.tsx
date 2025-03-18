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
        setStandards(data.entries);
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Launch Standards</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Join URLs Display */}
      {joinUrls.length > 0 && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-semibold mb-2">Join URLs:</h3>
          <div className="space-y-2">
            {joinUrls.map(({ studentId, url }) => {
              const student = students.find(s => s.application_user_id === studentId);
              return (
                <div key={studentId} className="flex items-center justify-between border-b border-green-200 pb-2">
                  <div className="font-medium">
                    {student ? `${student.first_name} ${student.last_name}` : studentId}
                  </div>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Join Link
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Teacher Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Select Teacher</h2>
        <div className="border rounded p-4 space-y-2">
          {teachers.map(teacher => (
            <div key={teacher.id} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`teacher-${teacher.application_user_id}`}
                name="teacher"
                checked={selectedTeacher?.application_user_id === teacher.application_user_id}
                onChange={() => setSelectedTeacher(teacher)}
                className="rounded"
              />
              <label htmlFor={`teacher-${teacher.application_user_id}`}>
                {teacher.first_name} {teacher.last_name}
                <span className="text-sm text-gray-500 ml-2">
                  (ID: {teacher.application_user_id})
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Students Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Select Students</h2>
          <div className="border rounded p-4 space-y-2 max-h-96 overflow-y-auto">
            {students.map(student => (
              <div key={student.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={student.application_user_id}
                  checked={selectedStudents.includes(student.application_user_id)}
                  onChange={() => handleStudentToggle(student.application_user_id)}
                  className="rounded"
                />
                <label htmlFor={student.application_user_id}>{student.first_name} {student.last_name}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Standards Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Select Standard</h2>
          <div className="space-y-4">
            {/* Standard Sets Dropdown */}
            <select
              value={selectedSet || ''}
              onChange={(e) => handleSetChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a Standard Set</option>
              {standardSets.map(set => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>

            {/* Standards List */}
            {selectedSet && (
              <div className="border rounded p-4 max-h-96 overflow-y-auto">
                {standards.map(standard => (
                  <div
                    key={standard.id}
                    onClick={() => handleStandardSelect(standard)}
                    className={`p-2 cursor-pointer rounded ${
                      selectedStandard?.id === standard.id
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
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
      <div className="mt-4">
        <button
          onClick={handleLaunch}
          disabled={!selectedStandard || selectedStudents.length === 0 || loading}
          className={`px-4 py-2 rounded ${
            !selectedStandard || selectedStudents.length === 0 || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Launching...' : 'Launch Standard'}
        </button>
      </div>
    </div>
  );
} 