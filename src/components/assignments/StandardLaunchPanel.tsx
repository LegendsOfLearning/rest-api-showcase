"use client";

import { useEffect, useState } from "react";
import type { AssignmentJoinTarget, Standard, StandardSet, User } from "@/types/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

type JoinResult = {
  studentId: string;
  url: string;
  target: AssignmentJoinTarget;
};
type AssignmentType = "standard" | "content" | "multi-activity";

const JOIN_TARGET_OPTIONS: Array<{
  value: AssignmentJoinTarget;
  label: string;
  description: string;
}> = [
  {
    value: "web",
    label: "Partner web player",
    description: "Use the V3 web join for the branded chromeless assignment player.",
  },
  {
    value: "awakening",
    label: "Awakening",
    description: "Use an Awakening-targeted assignment join.",
  },
];

export function StandardLaunchPanel() {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("standard");
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
  const [joinUrls, setJoinUrls] = useState<JoinResult[]>([]);
  const [joinTarget, setJoinTarget] = useState<AssignmentJoinTarget>("web");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(API_ENDPOINTS.USERS);
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }
        const students = data.filter((user: User) => user.role === "student");
        const teachers = data.filter((user: User) => user.role === "teacher");
        if (teachers.length === 0) {
          setError("No teachers found. Go to Users and create a teacher to continue.");
        }
        setStudents(students);
        setTeachers(teachers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchStandardSets() {
      try {
        let page = 1;
        const pageSize = 100;
        let all: StandardSet[] = [];

        while (true) {
          const response = await fetch(API_ENDPOINTS.STANDARD_SETS({ page, pageSize }));
          const data = await response.json();
          const results: StandardSet[] = Array.isArray(data?.results) ? data.results : [];
          all = all.concat(results);

          const total: number | undefined = typeof data?.total_count === "number" ? data.total_count : undefined;
          const perPage: number = typeof data?.per_page === "number" ? data.per_page : pageSize;

          const reachedTotal = typeof total === "number" ? all.length >= total : false;
          const isLastBySize = results.length < perPage;

          if (reachedTotal || isLastBySize) break;
          page += 1;
        }

        setStandardSets(all);
      } catch (err) {
        console.error("Error fetching standard sets:", err);
        setError("Failed to load standard sets");
      }
    }
    fetchStandardSets();
  }, []);

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
          throw new Error("Invalid response format");
        }
        const sorted = [...data.entries].sort((a, b) => a.standard.localeCompare(b.standard));
        setStandards(sorted);
      } catch (err) {
        console.error("Error fetching standards:", err);
        setError("Failed to load standards");
      }
    }
    fetchStandards();
  }, [selectedSet]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  };

  const handleLaunch = async () => {
    if (!selectedStandard || selectedStudents.length === 0 || !selectedTeacher) {
      setError("Please select a teacher, standard, and at least one student");
      return;
    }

    setLoading(true);
    setError(null);
    setJoinUrls([]);

    try {
      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "standard",
          standard_id: selectedStandard.id,
          application_user_id: selectedTeacher.application_user_id,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Launch failed");
      }

      const data = await response.json();
      if (!data?.assignment_id) {
        throw new Error("Invalid response format");
      }

      const joinPromises = selectedStudents.map(async (studentId) => {
        const join = API_ENDPOINTS.ASSIGNMENT_JOIN(data.assignment_id, studentId, joinTarget);
        const joinResponse = await fetch(join.url, {
          method: join.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(join.body),
        });

        if (!joinResponse.ok) {
          throw new Error(`Failed to get join URL for student ${studentId}`);
        }
        const joinData = await joinResponse.json();
        return {
          studentId,
          url: joinData.join_url as string,
          target: joinTarget,
        };
      });

      const results = await Promise.all(joinPromises);
      setJoinUrls(results);
    } catch (err) {
      console.error("Launch error:", err);
      setError("Failed to launch standard");
    } finally {
      setLoading(false);
    }
  };

  const assignmentTypes: Array<{
    value: AssignmentType;
    label: string;
    description: string;
  }> = [
    {
      value: "standard",
      label: "Standard",
      description: "Launch by learning standard",
    },
    {
      value: "content",
      label: "Content",
      description: "Launch specific games or videos",
    },
    {
      value: "multi-activity",
      label: "Multi-Activity",
      description: "Create custom multi-activity assignments",
    },
  ];

  return (
    <section className="space-y-8">
      {/* Assignment Type Selector */}
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted mb-2">Quick Launch</p>
          <h2 className="text-2xl font-semibold text-foreground">Create Assignment</h2>
          <p className="mt-2 text-sm text-muted">Select an assignment type and configure your launch settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assignmentTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                setAssignmentType(type.value);
                setError(null);
                setJoinUrls([]);
              }}
              className={`rounded-xl border-2 p-6 text-left transition-all ${
                assignmentType === type.value ? "border-accent bg-accent/10 shadow-lg" : "border-border bg-surface hover:border-accent/50 hover:bg-surface-100"
              }`}
            >
              <div className={`text-lg font-semibold mb-2 ${assignmentType === type.value ? "text-accent" : "text-foreground"}`}>{type.label}</div>
              <div className="text-sm text-muted">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1">Target Player</h3>
          <p className="text-sm text-muted">Choose the V3 assignment join target before generating launch URLs.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {JOIN_TARGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setJoinTarget(option.value);
                setJoinUrls([]);
              }}
              className={`rounded-lg border px-4 py-3 text-left transition-all ${
                joinTarget === option.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface hover:border-accent/50 hover:bg-surface-200 text-foreground"
              }`}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div className="mt-1 font-mono text-xs">target: {option.value}</div>
              <div className="mt-1 text-xs text-muted">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="rounded-xl border border-error bg-error px-6 py-4 text-sm text-error">{error}</div>}

      {/* Success Results */}
      {joinUrls.length > 0 && (
        <div className="portal-alert-success space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-success font-semibold mb-1">Success</p>
              <h3 className="text-lg font-semibold text-foreground">Join URLs Generated</h3>
            </div>
            <span className="text-sm text-muted bg-surface px-3 py-1 rounded-full border border-border">
              {joinUrls.length} {joinUrls.length === 1 ? "student" : "students"}
              <span className="ml-2 font-mono text-xs">target: {joinTarget}</span>
            </span>
          </div>
          <div className="divide-y divide-border/60 space-y-0">
            {joinUrls.map(({ studentId, url }) => {
              const student = students.find((s) => s.application_user_id === studentId);
              return (
                <div key={studentId} className="flex items-center justify-between py-4 first:pt-0">
                  <div>
                    <div className="text-base font-medium text-foreground">{student ? `${student.first_name} ${student.last_name}` : studentId}</div>
                    <div className="text-sm text-muted mt-1">ID: {student?.application_user_id ?? studentId}</div>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-accent hover:text-accent-hover hover:underline transition-colors"
                  >
                    Open link →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard Assignment Form */}
      {assignmentType === "standard" && (
        <>
          {/* Teacher and Students Selection */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Select Teacher</h3>
                <p className="text-sm text-muted">Choose the teacher for this assignment</p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {teachers.length === 0 ? (
                  <div className="text-sm text-muted py-4 text-center">No teachers available</div>
                ) : (
                  teachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => setSelectedTeacher(teacher)}
                      className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all ${
                        selectedTeacher?.application_user_id === teacher.application_user_id
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface hover:border-accent/50 hover:bg-surface-200"
                      }`}
                    >
                      <div className="font-medium text-foreground">
                        {teacher.first_name} {teacher.last_name}
                      </div>
                      <div className="text-sm text-muted mt-1">ID: {teacher.application_user_id}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Select Students</h3>
                <p className="text-sm text-muted">Choose students to receive this assignment</p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {students.length === 0 ? (
                  <div className="text-sm text-muted py-4 text-center">No students available</div>
                ) : (
                  students.map((student) => (
                    <label
                      key={student.id}
                      className={`flex items-center gap-4 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all ${
                        selectedStudents.includes(student.application_user_id)
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface hover:border-accent/50 hover:bg-surface-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.application_user_id)}
                        onChange={() => handleStudentToggle(student.application_user_id)}
                        className="h-5 w-5 rounded border-border text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-muted mt-1">ID: {student.application_user_id}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Standard Selection */}
          <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Select Standard</h3>
              <p className="text-sm text-muted">Choose a standard set and specific standard</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Standard Set</label>
                <select
                  value={selectedSet || ""}
                  onChange={(e) => {
                    setSelectedSet(e.target.value);
                    setSelectedStandard(null);
                  }}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select a Standard Set</option>
                  {standardSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSet && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Standard</label>
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-border bg-surface divide-y divide-border/60">
                    {standards.length === 0 ? (
                      <div className="text-sm text-muted py-4 text-center">No standards available</div>
                    ) : (
                      standards.map((standard) => (
                        <button
                          key={standard.id}
                          type="button"
                          onClick={() => setSelectedStandard(standard)}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                            selectedStandard?.id === standard.id ? "bg-accent/10 text-accent font-medium" : "hover:bg-surface-100 text-foreground"
                          }`}
                        >
                          {standard.standard}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Launch Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={!selectedStandard || selectedStudents.length === 0 || loading || !selectedTeacher}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                !selectedStandard || selectedStudents.length === 0 || loading || !selectedTeacher
                  ? "bg-surface-200 text-muted cursor-not-allowed"
                  : "bg-accent text-on-accent hover:bg-accent-hover shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? "Launching…" : "Launch Standard"}
            </button>
          </div>
        </>
      )}

      {/* Content Assignment Form - Placeholder */}
      {assignmentType === "content" && (
        <div className="rounded-xl border border-border bg-surface-100 p-12 text-center">
          <p className="text-muted">Content assignment creation coming soon</p>
        </div>
      )}

      {/* Multi-Activity Assignment Form - Placeholder */}
      {assignmentType === "multi-activity" && (
        <div className="rounded-xl border border-border bg-surface-100 p-12 text-center">
          <p className="text-muted">Multi-activity assignment creation coming soon</p>
        </div>
      )}
    </section>
  );
}
