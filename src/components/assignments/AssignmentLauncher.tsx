"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type {
  ApplicationMeResponse,
  AssignmentActivityCreateRequest,
  AssignmentJoinTarget,
  ContentDetail,
  FluencyFact,
  FluencyOperator,
  Standard,
  StandardSet,
  User,
} from "@/types/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  ContentPickerModal,
  type PickedContent,
} from "@/components/content/ContentPickerModal";
import StandardPickerModal from "@/components/content/StandardPickerModal";
import { PartnerVariablesPanel } from "@/components/partners/PartnerVariablesPanel";

type JoinResult = {
  studentId: string;
  url: string;
  target: AssignmentJoinTarget;
};
type AssignmentType = "standard" | "content" | "fluency" | "multi-activity";
type ActivityMode = "default" | "fluency";
type AssignmentDateStatus = "live" | "scheduled" | "ended" | "invalid";

type DraftFluencyFact = {
  id: string;
  a: string;
  b: string;
  op: FluencyOperator;
};

type JoinFailure = {
  studentId: string;
  error: string;
};

type JoinAttempt = JoinResult | JoinFailure;

type Activity = {
  id: string;
  mode: ActivityMode;
  content_id?: number;
  standard_id?: number;
  content?: PickedContent | null;
  standard?: {
    id: number;
    label: string;
    code?: string;
    image_url?: string;
  } | null;
  fluency_facts: DraftFluencyFact[];
};

const FLUENCY_OPERATORS: Array<{ value: FluencyOperator; label: string }> = [
  { value: "add", label: "+" },
  { value: "sub", label: "-" },
  { value: "mul", label: "×" },
  { value: "div", label: "÷" },
];

const FLUENCY_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  facts: Array<{ a: number; b: number; op: FluencyOperator }>;
}> = [
  {
    id: "mul-core",
    label: "Multiplication",
    description: "Core multiplication fluency",
    facts: [
      { a: 6, b: 7, op: "mul" },
      { a: 7, b: 8, op: "mul" },
      { a: 8, b: 9, op: "mul" },
    ],
  },
  {
    id: "mixed-ops",
    label: "Mixed Ops",
    description: "A balanced warmup set",
    facts: [
      { a: 8, b: 5, op: "add" },
      { a: 14, b: 6, op: "sub" },
      { a: 9, b: 4, op: "mul" },
      { a: 12, b: 3, op: "div" },
    ],
  },
  {
    id: "division-facts",
    label: "Division",
    description: "Whole-number division only",
    facts: [
      { a: 12, b: 3, op: "div" },
      { a: 24, b: 6, op: "div" },
      { a: 42, b: 7, op: "div" },
    ],
  },
];

const JOIN_TARGET_OPTIONS: Array<{
  value: AssignmentJoinTarget;
  label: string;
  description: string;
}> = [
  {
    value: "web",
    label: "Partner web player",
    description:
      "Best for one content activity in the branded chromeless player.",
  },
  {
    value: "awakening",
    label: "Awakening",
    description: "Creates an Awakening-targeted assignment join.",
  },
];

const ASSIGNMENT_DATE_STATUS_COPY: Record<
  AssignmentDateStatus,
  { label: string; className: string }
> = {
  live: {
    label: "Live today",
    className: "border-success bg-success text-success",
  },
  scheduled: {
    label: "Scheduled",
    className: "border-warning bg-warning text-warning",
  },
  ended: {
    label: "Ended",
    className: "border-error bg-error text-error",
  },
  invalid: {
    label: "Needs dates",
    className: "border-error bg-error text-error",
  },
};

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(parsed.getTime())) return null;
  if (formatDateInput(parsed) !== value) return null;

  return parsed;
}

function addDaysToDateString(dateString: string, days: number): string {
  const date = parseDateInput(dateString) ?? new Date();
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

function createDefaultAssignmentDates(): {
  startDate: string;
  endDate: string;
} {
  const startDate = formatDateInput(new Date());
  return {
    startDate,
    endDate: addDaysToDateString(startDate, 7),
  };
}

function getAssignmentDateError(
  startDate: string,
  endDate: string,
): string | null {
  if (!startDate || !endDate)
    return "Choose both a start date and an end date before launching.";
  if (!parseDateInput(startDate))
    return "Start date must be a valid calendar date.";
  if (!parseDateInput(endDate))
    return "End date must be a valid calendar date.";
  if (endDate < startDate)
    return "End date must be on or after the start date.";

  return null;
}

function getAssignmentDateStatus(
  startDate: string,
  endDate: string,
): AssignmentDateStatus {
  if (getAssignmentDateError(startDate, endDate)) return "invalid";

  const today = formatDateInput(new Date());
  if (startDate > today) return "scheduled";
  if (endDate < today) return "ended";
  return "live";
}

function formatReadableDate(dateString: string): string {
  const date = parseDateInput(dateString);
  if (!date) return dateString;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function createEmptyFact(): DraftFluencyFact {
  return { id: crypto.randomUUID(), a: "", b: "", op: "mul" };
}

function createEmptyActivity(): Activity {
  return {
    id: crypto.randomUUID(),
    mode: "default",
    fluency_facts: [createEmptyFact()],
  };
}

function parsePositiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeFluencyFacts(
  facts: DraftFluencyFact[],
): FluencyFact[] | null {
  const normalized = facts.map((fact) => {
    const a = parsePositiveInteger(fact.a);
    const b = parsePositiveInteger(fact.b);

    if (a === null || b === null) return null;
    if (fact.op === "div" && (b === 0 || a % b !== 0)) return null;

    return { a, b, op: fact.op };
  });

  return normalized.every((fact): fact is FluencyFact => fact !== null)
    ? normalized
    : null;
}

function isActivityValid(activity: Activity): boolean {
  if (activity.mode === "fluency") {
    const fluencyFacts = normalizeFluencyFacts(activity.fluency_facts);
    return (
      typeof activity.standard_id === "number" &&
      !!fluencyFacts &&
      fluencyFacts.length > 0
    );
  }

  return (
    typeof activity.content_id === "number" ||
    typeof activity.standard_id === "number"
  );
}

function recommendedJoinTarget(
  assignmentType: AssignmentType,
): AssignmentJoinTarget {
  return assignmentType === "content" ? "web" : "awakening";
}

function isJoinTargetUnavailable(
  assignmentType: AssignmentType,
  target: AssignmentJoinTarget,
): boolean {
  return (
    target === "web" &&
    (assignmentType === "standard" || assignmentType === "fluency")
  );
}

export function AssignmentLauncher() {
  const [assignmentType, setAssignmentType] =
    useState<AssignmentType>("standard");
  const [application, setApplication] = useState<ApplicationMeResponse | null>(
    null,
  );
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [standardSets, setStandardSets] = useState<StandardSet[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(
    null,
  );
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentDetail | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinUrls, setJoinUrls] = useState<JoinResult[]>([]);
  const [joinTarget, setJoinTarget] = useState<AssignmentJoinTarget>(() =>
    recommendedJoinTarget("standard"),
  );
  const [assignmentDates, setAssignmentDates] = useState(
    createDefaultAssignmentDates,
  );
  const [contentPickerOpen, setContentPickerOpen] = useState(false);
  const [fluencyFacts, setFluencyFacts] = useState<DraftFluencyFact[]>([
    createEmptyFact(),
    createEmptyFact(),
    createEmptyFact(),
  ]);

  // Multi-activity builder state
  const [activities, setActivities] = useState<Activity[]>([
    createEmptyActivity(),
  ]);
  const [contentPickerForActivity, setContentPickerForActivity] = useState<
    string | null
  >(null);
  const [standardPickerForActivity, setStandardPickerForActivity] = useState<
    string | null
  >(null);

  useEffect(() => {
    setJoinTarget((current) => {
      if (isJoinTargetUnavailable(assignmentType, current))
        return recommendedJoinTarget(assignmentType);
      if (assignmentType === "content") return "web";
      if (assignmentType === "standard" || assignmentType === "fluency")
        return "awakening";
      return current;
    });
    setJoinUrls([]);
  }, [assignmentType]);

  useEffect(() => {
    let cancelled = false;

    fetch(API_ENDPOINTS.APPLICATION_ME)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load application");
        return response.json();
      })
      .then((data: ApplicationMeResponse) => {
        if (!cancelled) setApplication(data);
      })
      .catch((err) => {
        console.error("Error fetching application:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
          setError(
            "No teachers found. Go to Users and create a teacher to continue.",
          );
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
          const response = await fetch(
            API_ENDPOINTS.STANDARD_SETS({ page, pageSize }),
          );
          const data = await response.json();
          const results: StandardSet[] = Array.isArray(data?.results)
            ? data.results
            : [];
          all = all.concat(results);

          const total: number | undefined =
            typeof data?.total_count === "number"
              ? data.total_count
              : undefined;
          const perPage: number =
            typeof data?.per_page === "number" ? data.per_page : pageSize;

          const reachedTotal =
            typeof total === "number" ? all.length >= total : false;
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
        const sorted = [...data.entries].sort((a, b) =>
          a.standard.localeCompare(b.standard),
        );
        setStandards(sorted);
      } catch (err) {
        console.error("Error fetching standards:", err);
        setError("Failed to load standards");
      }
    }
    fetchStandards();
  }, [selectedSet]);

  const createJoinUrls = async (
    assignmentId: number,
    studentIds: string[],
    target: AssignmentJoinTarget,
  ): Promise<{ successes: JoinResult[]; failures: JoinFailure[] }> => {
    const results: JoinAttempt[] = await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          const join = API_ENDPOINTS.ASSIGNMENT_JOIN(
            assignmentId,
            studentId,
            target,
          );
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
            target,
          } satisfies JoinResult;
        } catch (err) {
          return {
            studentId,
            error:
              err instanceof Error ? err.message : "Failed to get join URL",
          } satisfies JoinFailure;
        }
      }),
    );

    return results.reduce<{ successes: JoinResult[]; failures: JoinFailure[] }>(
      (acc, result) => {
        if ("url" in result && typeof result.url === "string") {
          acc.successes.push(result);
        } else {
          acc.failures.push(result as JoinFailure);
        }
        return acc;
      },
      { successes: [], failures: [] },
    );
  };

  const summarizeJoinFailures = (failures: JoinFailure[]): string | null => {
    if (failures.length === 0) return null;

    return `Assignment created, but join links could not be generated for: ${failures.map((failure) => failure.studentId).join(", ")}`;
  };

  const updateAssignmentDate = (
    field: "startDate" | "endDate",
    value: string,
  ) => {
    setAssignmentDates((prev) => ({ ...prev, [field]: value }));
    setJoinUrls([]);
  };

  const applyAssignmentDatePreset = (
    startOffsetDays: number,
    durationDays: number,
  ) => {
    const startDate = addDaysToDateString(
      formatDateInput(new Date()),
      startOffsetDays,
    );
    setAssignmentDates({
      startDate,
      endDate: addDaysToDateString(startDate, durationDays),
    });
    setJoinUrls([]);
  };

  const getAssignmentScheduleOrSetError = (): {
    start_date: string;
    end_date: string;
  } | null => {
    const scheduleError = getAssignmentDateError(
      assignmentDates.startDate,
      assignmentDates.endDate,
    );
    if (scheduleError) {
      setError(scheduleError);
      return null;
    }

    return {
      start_date: assignmentDates.startDate,
      end_date: assignmentDates.endDate,
    };
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleStandardLaunch = async () => {
    if (
      !selectedStandard ||
      selectedStudents.length === 0 ||
      !selectedTeacher
    ) {
      setError("Please select a teacher, standard, and at least one student");
      return;
    }

    const assignmentSchedule = getAssignmentScheduleOrSetError();
    if (!assignmentSchedule) return;

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
          ...assignmentSchedule,
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

      const { successes, failures } = await createJoinUrls(
        data.assignment_id,
        selectedStudents,
        joinTarget,
      );
      setJoinUrls(successes);

      const joinFailureMessage = summarizeJoinFailures(failures);
      if (joinFailureMessage) {
        setError(joinFailureMessage);
      }
    } catch (err) {
      console.error("Launch error:", err);
      setError("Failed to launch standard");
    } finally {
      setLoading(false);
    }
  };

  const handleContentLaunch = async () => {
    if (!selectedContent || selectedStudents.length === 0 || !selectedTeacher) {
      setError("Please select a teacher, content, and at least one student");
      return;
    }

    const rawStandardId = selectedContent.standards?.[0]?.id;
    const standardId =
      typeof rawStandardId === "number"
        ? rawStandardId
        : typeof rawStandardId === "string"
          ? parsePositiveInteger(rawStandardId)
          : null;

    if (standardId === null) {
      setError(
        "Selected content does not have an aligned standard for assignment launch.",
      );
      return;
    }

    const assignmentSchedule = getAssignmentScheduleOrSetError();
    if (!assignmentSchedule) return;

    setLoading(true);
    setError(null);
    setJoinUrls([]);

    try {
      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "content",
          content_id: selectedContent.id,
          standard_id: standardId,
          application_user_id: selectedTeacher.application_user_id,
          ...assignmentSchedule,
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

      const { successes, failures } = await createJoinUrls(
        data.assignment_id,
        selectedStudents,
        joinTarget,
      );
      setJoinUrls(successes);

      const joinFailureMessage = summarizeJoinFailures(failures);
      if (joinFailureMessage) {
        setError(joinFailureMessage);
      }
    } catch (err) {
      console.error("Launch error:", err);
      setError("Failed to launch content");
    } finally {
      setLoading(false);
    }
  };

  const addStandaloneFluencyFact = () => {
    setFluencyFacts((prev) => [...prev, createEmptyFact()]);
  };

  const updateStandaloneFluencyFact = (
    factId: string,
    updates: Partial<DraftFluencyFact>,
  ) => {
    setFluencyFacts((prev) =>
      prev.map((fact) => (fact.id === factId ? { ...fact, ...updates } : fact)),
    );
  };

  const removeStandaloneFluencyFact = (factId: string) => {
    setFluencyFacts((prev) => {
      const remaining = prev.filter((fact) => fact.id !== factId);
      return remaining.length > 0 ? remaining : [createEmptyFact()];
    });
  };

  const applyFluencyPreset = (
    presetFacts: Array<{ a: number; b: number; op: FluencyOperator }>,
  ) => {
    setFluencyFacts(
      presetFacts.map((fact) => ({
        id: crypto.randomUUID(),
        a: String(fact.a),
        b: String(fact.b),
        op: fact.op,
      })),
    );
  };

  const handleFluencyLaunch = async () => {
    const normalizedFacts = normalizeFluencyFacts(fluencyFacts);

    if (
      !selectedStandard ||
      !selectedTeacher ||
      selectedStudents.length === 0 ||
      !normalizedFacts ||
      normalizedFacts.length === 0
    ) {
      setError(
        "Please choose a teacher, a standard, at least one student, and a complete fluency fact set.",
      );
      return;
    }

    const assignmentSchedule = getAssignmentScheduleOrSetError();
    if (!assignmentSchedule) return;

    setLoading(true);
    setError(null);
    setJoinUrls([]);

    try {
      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_user_id: selectedTeacher.application_user_id,
          name: "Fluency Session",
          ...assignmentSchedule,
          activities: [
            {
              type: "awakening_fluency",
              standard_id: selectedStandard.id,
              fluency_facts: normalizedFacts,
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.detail || "Launch failed");
      }

      const data = await response.json();
      if (!data?.assignment_id) {
        throw new Error("Invalid response format");
      }

      const { successes, failures } = await createJoinUrls(
        data.assignment_id,
        selectedStudents,
        joinTarget,
      );
      setJoinUrls(successes);

      const joinFailureMessage = summarizeJoinFailures(failures);
      if (joinFailureMessage) {
        setError(joinFailureMessage);
      }
    } catch (err) {
      console.error("Launch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to launch fluency session",
      );
    } finally {
      setLoading(false);
    }
  };

  const assignmentTypes: Array<{
    value: AssignmentType;
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      value: "standard",
      label: "Standard",
      description: "Launch by learning standard",
      icon: "📚",
    },
    {
      value: "content",
      label: "Content",
      description: "Launch a single game or video",
      icon: "🎮",
    },
    {
      value: "fluency",
      label: "Fluency",
      description: "Create a facts-based fluency session",
      icon: "✨",
    },
    {
      value: "multi-activity",
      label: "Multi-Activity",
      description: "Build custom multi-activity assignments",
      icon: "🔧",
    },
  ];

  // Multi-activity builder helpers
  const addActivity = () => {
    setActivities((prev) => [...prev, createEmptyActivity()]);
  };

  const removeActivity = (activityId: string) => {
    setActivities((prev) => {
      const filtered = prev.filter((a) => a.id !== activityId);
      return filtered.length > 0 ? filtered : [createEmptyActivity()];
    });
  };

  const moveActivity = (activityId: string, direction: "up" | "down") => {
    setActivities((prev) => {
      const index = prev.findIndex((a) => a.id === activityId);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newActivities = [...prev];
      [newActivities[index], newActivities[newIndex]] = [
        newActivities[newIndex],
        newActivities[index],
      ];
      return newActivities;
    });
  };

  const updateActivity = (activityId: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, ...updates } : a)),
    );
  };

  const setActivityMode = (activityId: string, mode: ActivityMode) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id !== activityId) return activity;

        if (mode === "fluency") {
          return {
            ...activity,
            mode,
            content: null,
            content_id: undefined,
            fluency_facts:
              activity.fluency_facts.length > 0
                ? activity.fluency_facts
                : [createEmptyFact()],
          };
        }

        return { ...activity, mode };
      }),
    );
  };

  const addFluencyFact = (activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              fluency_facts: [...activity.fluency_facts, createEmptyFact()],
            }
          : activity,
      ),
    );
  };

  const updateFluencyFact = (
    activityId: string,
    factId: string,
    updates: Partial<DraftFluencyFact>,
  ) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              fluency_facts: activity.fluency_facts.map((fact) =>
                fact.id === factId ? { ...fact, ...updates } : fact,
              ),
            }
          : activity,
      ),
    );
  };

  const removeFluencyFact = (activityId: string, factId: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id !== activityId) return activity;

        const remaining = activity.fluency_facts.filter(
          (fact) => fact.id !== factId,
        );
        return {
          ...activity,
          fluency_facts: remaining.length > 0 ? remaining : [createEmptyFact()],
        };
      }),
    );
  };

  // Auto-fetch content details when content_id is set
  useEffect(() => {
    if (assignmentType !== "multi-activity") return;

    activities.forEach((activity) => {
      if (activity.content_id && !activity.content) {
        fetch(API_ENDPOINTS.CONTENT_DETAIL(activity.content_id))
          .then(async (res) => {
            if (!res.ok) return;
            const data: ContentDetail = await res.json();
            const picked: PickedContent = {
              id: data.id,
              name: data.game,
              description: data.description,
              thumbnail_url: data.image,
              game_type: data.type,
              content_type: data.content_type,
              is_question_game: !!data.is_question_game,
            };
            updateActivity(activity.id, { content: picked });
          })
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.map((a) => a.content_id).join(","), assignmentType]);

  const handleMultiActivityLaunch = async () => {
    if (
      activities.length === 0 ||
      selectedStudents.length === 0 ||
      !selectedTeacher
    ) {
      setError(
        "Please select a teacher, at least one activity, and at least one student",
      );
      return;
    }

    const hasInvalidActivities = activities.some(
      (activity) => !isActivityValid(activity),
    );
    if (hasInvalidActivities) {
      setError("Please complete or remove every activity before launch.");
      return;
    }

    const assignmentSchedule = getAssignmentScheduleOrSetError();
    if (!assignmentSchedule) return;

    const payloadActivities = activities.map(
      (activity): AssignmentActivityCreateRequest => {
        if (activity.mode === "fluency") {
          return {
            type: "awakening_fluency",
            standard_id: activity.standard_id!,
            fluency_facts: normalizeFluencyFacts(activity.fluency_facts)!,
          };
        }

        const nextActivity: AssignmentActivityCreateRequest = {};
        if (typeof activity.content_id === "number")
          nextActivity.content_id = activity.content_id;
        if (typeof activity.standard_id === "number")
          nextActivity.standard_id = activity.standard_id;
        return nextActivity;
      },
    );

    setLoading(true);
    setError(null);
    setJoinUrls([]);

    try {
      const payload = {
        application_user_id: selectedTeacher.application_user_id,
        ...assignmentSchedule,
        activities: payloadActivities,
      };

      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.detail || "Launch failed");
      }

      const data = await response.json();
      if (!data?.assignment_id) {
        throw new Error("Invalid response format");
      }

      const { successes, failures } = await createJoinUrls(
        data.assignment_id,
        selectedStudents,
        joinTarget,
      );
      setJoinUrls(successes);

      const joinFailureMessage = summarizeJoinFailures(failures);
      if (joinFailureMessage) {
        setError(joinFailureMessage);
      }
    } catch (err) {
      console.error("Launch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to launch multi-activity assignment",
      );
    } finally {
      setLoading(false);
    }
  };

  const assignmentDateError = getAssignmentDateError(
    assignmentDates.startDate,
    assignmentDates.endDate,
  );
  const assignmentDateStatus = getAssignmentDateStatus(
    assignmentDates.startDate,
    assignmentDates.endDate,
  );
  const assignmentDateStatusCopy =
    ASSIGNMENT_DATE_STATUS_COPY[assignmentDateStatus];
  const assignmentDateSummary =
    assignmentDateStatus === "live"
      ? `Students can play from ${formatReadableDate(assignmentDates.startDate)} through ${formatReadableDate(assignmentDates.endDate)}.`
      : assignmentDateStatus === "scheduled"
        ? `Student links will show "assignment not started" until ${formatReadableDate(assignmentDates.startDate)}.`
        : assignmentDateStatus === "ended"
          ? `This window ended on ${formatReadableDate(assignmentDates.endDate)}. Move the end date forward before launch.`
          : (assignmentDateError ?? "Complete the assignment date window.");

  const canLaunch = () => {
    if (assignmentDateError) return false;

    if (assignmentType === "standard") {
      return selectedStandard && selectedStudents.length > 0 && selectedTeacher;
    } else if (assignmentType === "content") {
      return selectedContent && selectedStudents.length > 0 && selectedTeacher;
    } else if (assignmentType === "fluency") {
      return (
        selectedStandard &&
        selectedStudents.length > 0 &&
        selectedTeacher &&
        !!normalizeFluencyFacts(fluencyFacts)
      );
    } else if (assignmentType === "multi-activity") {
      const hasInvalidActivities = activities.some(
        (activity) => !isActivityValid(activity),
      );
      return (
        !hasInvalidActivities &&
        activities.length > 0 &&
        selectedStudents.length > 0 &&
        selectedTeacher
      );
    }
    return false;
  };

  const branding = application?.branding ?? null;
  const selectedJoinTarget = JOIN_TARGET_OPTIONS.find(
    (option) => option.value === joinTarget,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-6">
          Create Assignment
        </h2>

        {/* Content and Audience Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Content Selection - Left Column */}
          <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Select Content
              </h3>
              <p className="text-sm text-muted">
                Choose assignment type and content
              </p>
            </div>

            {/* Assignment Type Selector - Compact tabs */}
            <div className="flex gap-2 border-b border-border pb-4">
              {assignmentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setAssignmentType(type.value);
                    setError(null);
                    setJoinUrls([]);
                    // Reset activities when switching away from multi-activity
                    if (type.value !== "multi-activity") {
                      setActivities([createEmptyActivity()]);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    assignmentType === type.value
                      ? "bg-accent text-on-accent shadow-sm"
                      : "bg-surface text-muted hover:bg-surface-200 hover:text-foreground"
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            {/* Standard Assignment Content */}
            {assignmentType === "standard" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Standard Set
                  </label>
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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Standard
                    </label>
                    <div className="max-h-[calc(100vh-500px)] min-h-[200px] overflow-y-auto rounded-lg border border-border bg-surface divide-y divide-border/60">
                      {standards.length === 0 ? (
                        <div className="text-sm text-muted py-4 text-center">
                          No standards available
                        </div>
                      ) : (
                        standards.map((standard) => (
                          <button
                            key={standard.id}
                            type="button"
                            onClick={() => setSelectedStandard(standard)}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                              selectedStandard?.id === standard.id
                                ? "bg-accent/10 text-accent font-medium"
                                : "hover:bg-surface-100 text-foreground"
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
            )}

            {/* Content Assignment Content */}
            {assignmentType === "content" && (
              <div>
                {selectedContent ? (
                  <div className="rounded-lg border-2 border-accent bg-accent/5 p-4">
                    <div className="flex items-start gap-4">
                      {selectedContent.image && (
                        <Image
                          src={selectedContent.image}
                          alt=""
                          width={80}
                          height={80}
                          className="w-20 h-20 rounded-lg object-cover"
                          unoptimized
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground mb-1">
                          {selectedContent.game}
                        </div>
                        <div className="text-sm text-muted">
                          {selectedContent.type} •{" "}
                          {selectedContent.content_type}
                        </div>
                        {selectedContent.standards?.[0] && (
                          <div className="text-xs text-muted mt-1">
                            Standard: {selectedContent.standards[0].standard}{" "}
                            (ID {selectedContent.standards[0].id})
                          </div>
                        )}
                        <div className="text-xs text-muted mt-2">
                          ID: {selectedContent.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedContent(null)}
                        className="text-sm text-muted hover:text-foreground transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setContentPickerOpen(true)}
                    className="w-full rounded-lg border-2 border-dashed border-border bg-surface px-6 py-8 text-center hover:border-accent hover:bg-surface-100 transition-all min-h-[200px] flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">🎮</div>
                    <div className="font-medium text-foreground mb-1">
                      Select Content
                    </div>
                    <div className="text-sm text-muted">
                      Choose a game or video to launch
                    </div>
                  </button>
                )}
              </div>
            )}

            {assignmentType === "fluency" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-accent/20 bg-[linear-gradient(135deg,rgba(0,188,212,0.12),rgba(16,185,129,0.10))] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-accent font-semibold mb-2">
                        Fluency Session
                      </p>
                      <h4 className="text-xl font-semibold text-foreground">
                        Build an exact fact set
                      </h4>
                      <p className="text-sm text-muted mt-2 max-w-xl">
                        Choose a standard, enter the precise Math Basecamp
                        facts, and launch directly into Awakening.
                      </p>
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-2 text-xs text-foreground/80 md:flex">
                      <span>Exact facts</span>
                      <span className="h-1 w-1 rounded-full bg-foreground/40" />
                      <span>Instant launch</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Standard Set
                    </label>
                    <select
                      value={selectedSet || ""}
                      onChange={(e) => {
                        setSelectedSet(e.target.value);
                        setSelectedStandard(null);
                      }}
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Standard
                      </label>
                      <div className="max-h-[220px] overflow-y-auto rounded-xl border border-border bg-surface divide-y divide-border/60">
                        {standards.length === 0 ? (
                          <div className="text-sm text-muted py-4 text-center">
                            No standards available
                          </div>
                        ) : (
                          standards.map((standard) => (
                            <button
                              key={standard.id}
                              type="button"
                              onClick={() => setSelectedStandard(standard)}
                              className={`w-full px-4 py-3 text-left transition-colors ${
                                selectedStandard?.id === standard.id
                                  ? "bg-accent/10"
                                  : "hover:bg-surface-100"
                              }`}
                            >
                              <div
                                className={`text-sm font-medium ${selectedStandard?.id === standard.id ? "text-accent" : "text-foreground"}`}
                              >
                                {standard.standard}
                              </div>
                              <div className="text-xs text-muted mt-1">
                                {standard.standard_code}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Fact Builder
                      </label>
                      <p className="text-xs text-muted mt-1">
                        Students will practice exactly these equations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addStandaloneFluencyFact}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-on-accent hover:bg-accent-hover transition-colors"
                    >
                      Add Fact
                    </button>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    {FLUENCY_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyFluencyPreset(preset.facts)}
                        className="rounded-xl border border-border bg-surface px-4 py-3 text-left hover:border-accent/50 hover:bg-surface-100 transition-all"
                      >
                        <div className="text-sm font-medium text-foreground">
                          {preset.label}
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {fluencyFacts.map((fact, index) => {
                      const a = parsePositiveInteger(fact.a);
                      const b = parsePositiveInteger(fact.b);
                      const divisionError =
                        fact.op === "div" &&
                        a !== null &&
                        b !== null &&
                        (b === 0 || a % b !== 0);

                      return (
                        <div
                          key={fact.id}
                          className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-[0.24em] text-muted font-semibold">
                                Fact {index + 1}
                              </div>
                              <div className="text-sm text-foreground mt-1">
                                {fact.a || "?"}{" "}
                                {
                                  FLUENCY_OPERATORS.find(
                                    (item) => item.value === fact.op,
                                  )?.label
                                }{" "}
                                {fact.b || "?"}
                              </div>
                            </div>
                            {fluencyFacts.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeStandaloneFluencyFact(fact.id)
                                }
                                className="text-xs text-muted hover:text-error transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
                            <input
                              aria-label={`Fact ${index + 1} first operand`}
                              type="number"
                              inputMode="numeric"
                              value={fact.a}
                              onChange={(event) =>
                                updateStandaloneFluencyFact(fact.id, {
                                  a: event.target.value,
                                })
                              }
                              placeholder="First number"
                              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                            />
                            <select
                              aria-label={`Fact ${index + 1} operator`}
                              value={fact.op}
                              onChange={(event) =>
                                updateStandaloneFluencyFact(fact.id, {
                                  op: event.target.value as FluencyOperator,
                                })
                              }
                              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground min-w-[84px]"
                            >
                              {FLUENCY_OPERATORS.map((operator) => (
                                <option
                                  key={operator.value}
                                  value={operator.value}
                                >
                                  {operator.label}
                                </option>
                              ))}
                            </select>
                            <input
                              aria-label={`Fact ${index + 1} second operand`}
                              type="number"
                              inputMode="numeric"
                              value={fact.b}
                              onChange={(event) =>
                                updateStandaloneFluencyFact(fact.id, {
                                  b: event.target.value,
                                })
                              }
                              placeholder="Second number"
                              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                            />
                          </div>

                          {divisionError ? (
                            <div className="rounded-lg border border-error bg-error px-3 py-2 text-xs text-error">
                              Division facts need a whole-number answer. Adjust
                              these values before launch.
                            </div>
                          ) : (
                            <div className="text-xs text-muted">
                              {a !== null && b !== null
                                ? `Ready to send as ${a} ${FLUENCY_OPERATORS.find((item) => item.value === fact.op)?.label} ${b}`
                                : "Complete both operands to include this fact in the session."}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Activity Builder */}
            {assignmentType === "multi-activity" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-1">
                      Activities
                    </h4>
                    <p className="text-sm text-muted">
                      Add content or standards to build your assignment
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addActivity}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-on-accent hover:bg-accent-hover transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Activity
                  </button>
                </div>

                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="rounded-lg border border-border bg-surface p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">
                              Activity {index + 1}
                            </div>
                            <div className="text-xs text-muted mt-0.5">
                              {activity.mode === "fluency"
                                ? "Fluency activity with partner-configured facts"
                                : !activity.content && !activity.standard
                                  ? "No content or standard selected"
                                  : "Standard or content activity"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveActivity(activity.id, "up")}
                            disabled={index === 0}
                            className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveActivity(activity.id, "down")}
                            disabled={index === activities.length - 1}
                            className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          {activities.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeActivity(activity.id)}
                              className="rounded p-1.5 text-muted transition-colors hover:bg-surface-100 hover:text-error"
                              title="Remove activity"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Activity Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActivityMode(activity.id, "default")
                            }
                            className={`rounded-lg border px-3 py-2 text-sm text-left transition-all ${
                              activity.mode === "default"
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border bg-surface hover:border-accent/50 hover:bg-surface-100 text-foreground"
                            }`}
                          >
                            <div className="font-medium">
                              Standard / Content
                            </div>
                            <div className="text-xs text-muted mt-0.5">
                              Mini-game, video, or mastery-style activity
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActivityMode(activity.id, "fluency")
                            }
                            className={`rounded-lg border px-3 py-2 text-sm text-left transition-all ${
                              activity.mode === "fluency"
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border bg-surface hover:border-accent/50 hover:bg-surface-100 text-foreground"
                            }`}
                          >
                            <div className="font-medium">Fluency Facts</div>
                            <div className="text-xs text-muted mt-0.5">
                              Sends `awakening_fluency` with exact facts
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Content Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1.5">
                            Content{" "}
                            {activity.mode === "fluency"
                              ? "(not used)"
                              : "(optional)"}
                          </label>
                          {activity.mode === "fluency" ? (
                            <div className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-sm text-muted">
                              Fluency activities do not take content. Choose a
                              standard and enter facts below.
                            </div>
                          ) : activity.content ? (
                            <div className="rounded-lg border-2 border-accent bg-accent/5 p-3">
                              <div className="flex items-start gap-3">
                                {activity.content.thumbnail_url && (
                                  <Image
                                    src={activity.content.thumbnail_url}
                                    alt=""
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    unoptimized
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">
                                    {activity.content.name}
                                  </div>
                                  {activity.content.game_type && (
                                    <div className="text-xs text-muted mt-0.5">
                                      {activity.content.game_type} •{" "}
                                      {activity.content.content_type}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateActivity(activity.id, {
                                      content: null,
                                      content_id: undefined,
                                    });
                                  }}
                                  className="text-xs text-muted hover:text-foreground transition-colors flex-shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setContentPickerForActivity(activity.id)
                              }
                              className="w-full rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted hover:border-accent hover:bg-surface-100 transition-all text-left"
                            >
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                <span>Add Content</span>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Standard Selection */}
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1.5">
                            Standard{" "}
                            {activity.mode === "fluency"
                              ? "(required)"
                              : "(optional)"}
                          </label>
                          {activity.standard ? (
                            <div className="rounded-lg border-2 border-accent bg-accent/5 p-3">
                              <div className="flex items-start gap-3">
                                {activity.standard.image_url && (
                                  <Image
                                    src={activity.standard.image_url}
                                    alt=""
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    unoptimized
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground">
                                    {activity.standard.label}
                                  </div>
                                  {activity.standard.code && (
                                    <div className="text-xs text-muted mt-0.5">
                                      {activity.standard.code}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateActivity(activity.id, {
                                      standard: null,
                                      standard_id: undefined,
                                    });
                                  }}
                                  className="text-xs text-muted hover:text-foreground transition-colors flex-shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setStandardPickerForActivity(activity.id)
                              }
                              className="w-full rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted hover:border-accent hover:bg-surface-100 transition-all text-left"
                            >
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                <span>Add Standard</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>

                      {activity.mode === "fluency" && (
                        <div className="space-y-3 rounded-lg border border-border bg-surface-100 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                Fluency Facts
                              </div>
                              <div className="text-xs text-muted mt-0.5">
                                Students will practice exactly these facts.
                                Division facts must resolve to whole numbers.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addFluencyFact(activity.id)}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-on-accent hover:bg-accent-hover transition-colors"
                            >
                              Add Fact
                            </button>
                          </div>

                          <div className="space-y-2">
                            {activity.fluency_facts.map((fact, factIndex) => {
                              const a = parsePositiveInteger(fact.a);
                              const b = parsePositiveInteger(fact.b);
                              const hasExactDivisionIssue =
                                fact.op === "div" &&
                                a !== null &&
                                b !== null &&
                                (b === 0 || a % b !== 0);

                              return (
                                <div
                                  key={fact.id}
                                  className="rounded-lg border border-border bg-surface p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium text-muted uppercase tracking-wide">
                                      Fact {factIndex + 1}
                                    </div>
                                    {activity.fluency_facts.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeFluencyFact(
                                            activity.id,
                                            fact.id,
                                          )
                                        }
                                        className="text-xs text-muted hover:text-error transition-colors"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
                                    <input
                                      aria-label={`Activity ${index + 1} fact ${factIndex + 1} first operand`}
                                      type="number"
                                      inputMode="numeric"
                                      value={fact.a}
                                      onChange={(event) =>
                                        updateFluencyFact(
                                          activity.id,
                                          fact.id,
                                          { a: event.target.value },
                                        )
                                      }
                                      placeholder="A"
                                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                    <select
                                      aria-label={`Activity ${index + 1} fact ${factIndex + 1} operator`}
                                      value={fact.op}
                                      onChange={(event) =>
                                        updateFluencyFact(
                                          activity.id,
                                          fact.id,
                                          {
                                            op: event.target
                                              .value as FluencyOperator,
                                          },
                                        )
                                      }
                                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                      {FLUENCY_OPERATORS.map((operator) => (
                                        <option
                                          key={operator.value}
                                          value={operator.value}
                                        >
                                          {operator.label}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      aria-label={`Activity ${index + 1} fact ${factIndex + 1} second operand`}
                                      type="number"
                                      inputMode="numeric"
                                      value={fact.b}
                                      onChange={(event) =>
                                        updateFluencyFact(
                                          activity.id,
                                          fact.id,
                                          { b: event.target.value },
                                        )
                                      }
                                      placeholder="B"
                                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </div>
                                  {hasExactDivisionIssue && (
                                    <div className="text-xs text-error">
                                      Division facts must have a whole-number
                                      answer. Adjust the operands before launch.
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Validation hint */}
                      {activity.mode === "default" &&
                        !activity.content &&
                        !activity.standard && (
                          <div className="text-xs text-muted bg-surface-100 rounded px-2 py-1.5">
                            💡 Add at least one content item or standard to this
                            activity
                          </div>
                        )}
                      {activity.mode === "fluency" && !activity.standard && (
                        <div className="text-xs text-muted bg-surface-100 rounded px-2 py-1.5">
                          💡 Fluency activities need a standard and at least one
                          complete fact
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {activities.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center">
                    <div className="text-2xl mb-2">📚</div>
                    <div className="text-sm font-medium text-foreground mb-1">
                      No activities yet
                    </div>
                    <div className="text-xs text-muted">
                      Click &quot;Add Activity&quot; to get started
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audience Selection - Right Column */}
          <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Select Audience
              </h3>
              <p className="text-sm text-muted">
                Choose teacher, students, and player target
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Target Player
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {JOIN_TARGET_OPTIONS.map((option) => {
                  const unavailable = isJoinTargetUnavailable(
                    assignmentType,
                    option.value,
                  );

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={unavailable}
                      onClick={() => {
                        setJoinTarget(option.value);
                        setJoinUrls([]);
                      }}
                      className={`rounded-lg border px-3 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                        joinTarget === option.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface hover:border-accent/50 hover:bg-surface-200 text-foreground"
                      }`}
                    >
                      <div className="text-sm font-semibold">
                        {option.label}
                      </div>
                      <div className="mt-1 font-mono text-xs">
                        target: {option.value}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {unavailable
                          ? "Standard and fluency launches use Awakening so students do not land on an unsupported web-player step."
                          : option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Assignment Dates
                  </label>
                  <p className="mt-1 text-xs text-muted">
                    These dates control when student join links can open the
                    player.
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${assignmentDateStatusCopy.className}`}
                >
                  {assignmentDateStatusCopy.label}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="block text-xs font-medium text-foreground mb-1.5">
                    Start date
                  </span>
                  <input
                    type="date"
                    value={assignmentDates.startDate}
                    onChange={(event) =>
                      updateAssignmentDate("startDate", event.target.value)
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-foreground mb-1.5">
                    End date
                  </span>
                  <input
                    type="date"
                    value={assignmentDates.endDate}
                    min={assignmentDates.startDate || undefined}
                    onChange={(event) =>
                      updateAssignmentDate("endDate", event.target.value)
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyAssignmentDatePreset(0, 7)}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/50 hover:bg-surface-200 transition-colors"
                >
                  Today + 7 days
                </button>
                <button
                  type="button"
                  onClick={() => applyAssignmentDatePreset(0, 14)}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/50 hover:bg-surface-200 transition-colors"
                >
                  Today + 14 days
                </button>
                <button
                  type="button"
                  onClick={() => applyAssignmentDatePreset(1, 7)}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/50 hover:bg-surface-200 transition-colors"
                >
                  Tomorrow + 7 days
                </button>
              </div>

              <div
                className={`border-l-4 px-3 py-2 text-xs ${
                  assignmentDateStatus === "live"
                    ? "border-success bg-success text-success"
                    : assignmentDateStatus === "scheduled"
                      ? "border-warning bg-warning text-warning"
                      : "border-error bg-error text-error"
                }`}
              >
                {assignmentDateSummary}
              </div>
            </div>

            <PartnerVariablesPanel
              branding={branding}
              appName={application?.name}
              eyebrow="Resolved app branding"
              description="This is the effective app-first branding returned to the active OAuth application."
              readOnlyMessage="Branding is read-only in this public sample and is configured outside the assignment request flow."
            />

            {/* Teacher Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Teacher
              </label>
              <div className="space-y-1.5 max-h-[calc(40vh-200px)] overflow-y-auto">
                {teachers.length === 0 ? (
                  <div className="text-sm text-muted py-2 text-center">
                    No teachers available
                  </div>
                ) : (
                  teachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => setSelectedTeacher(teacher)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-all ${
                        selectedTeacher?.application_user_id ===
                        teacher.application_user_id
                          ? "border-accent bg-accent/10 text-accent font-medium"
                          : "border-border bg-surface hover:border-accent/50 hover:bg-surface-200 text-foreground"
                      }`}
                    >
                      {teacher.first_name} {teacher.last_name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Students Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Students
              </label>
              <div className="space-y-1.5 max-h-[calc(40vh-200px)] overflow-y-auto">
                {students.length === 0 ? (
                  <div className="text-sm text-muted py-2 text-center">
                    No students available
                  </div>
                ) : (
                  students.map((student) => (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-all ${
                        selectedStudents.includes(student.application_user_id)
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface hover:border-accent/50 hover:bg-surface-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(
                          student.application_user_id,
                        )}
                        onChange={() =>
                          handleStudentToggle(student.application_user_id)
                        }
                        className="h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-accent focus:ring-offset-1"
                      />
                      <span
                        className={`text-sm flex-1 ${selectedStudents.includes(student.application_user_id) ? "text-accent font-medium" : "text-foreground"}`}
                      >
                        {student.first_name} {student.last_name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="portal-alert-error px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="text-error text-xl">⚠️</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-error">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Results */}
      {joinUrls.length > 0 && (
        <div className="portal-alert-success space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-success text-xl">✓</div>
              <div>
                <p className="text-xs uppercase tracking-widest text-success font-semibold mb-1">
                  Success
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  Join URLs Generated
                </h3>
                <div className="mt-1 text-xs text-muted">
                  {selectedJoinTarget?.label ?? joinTarget} - target:{" "}
                  {joinTarget}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {assignmentDateSummary}
                </div>
              </div>
            </div>
            <span className="text-sm text-muted bg-surface px-4 py-2 rounded-full border border-border font-medium">
              {joinUrls.length} {joinUrls.length === 1 ? "student" : "students"}
            </span>
          </div>
          <div className="divide-y divide-border/60 space-y-0">
            {joinUrls.map(({ studentId, url }) => {
              const student = students.find(
                (s) => s.application_user_id === studentId,
              );
              return (
                <div
                  key={studentId}
                  className="flex items-center justify-between py-4 first:pt-0"
                >
                  <div>
                    <div className="text-base font-medium text-foreground">
                      {student
                        ? `${student.first_name} ${student.last_name}`
                        : studentId}
                    </div>
                    <div className="text-sm text-muted mt-1">
                      ID: {student?.application_user_id ?? studentId}
                    </div>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-accent hover:text-accent-hover hover:underline transition-colors flex items-center gap-1.5"
                  >
                    Open link
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Launch Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={
            assignmentType === "standard"
              ? handleStandardLaunch
              : assignmentType === "content"
                ? handleContentLaunch
                : assignmentType === "fluency"
                  ? handleFluencyLaunch
                  : handleMultiActivityLaunch
          }
          disabled={!canLaunch() || loading}
          className={`px-8 py-3 rounded-lg font-medium text-sm transition-all ${
            !canLaunch() || loading
              ? "bg-surface-200 text-muted cursor-not-allowed"
              : "bg-accent text-on-accent hover:bg-accent-hover shadow-lg hover:shadow-xl"
          }`}
        >
          {loading
            ? "Launching…"
            : assignmentType === "standard"
              ? "Launch Standard"
              : assignmentType === "content"
                ? "Launch Content"
                : assignmentType === "fluency"
                  ? "Launch Fluency Session"
                  : "Launch Multi-Activity Assignment"}
        </button>
      </div>

      {/* Content Picker for single content assignment */}
      <ContentPickerModal
        open={contentPickerOpen}
        onClose={() => setContentPickerOpen(false)}
        onSelect={async (content) => {
          // Fetch full content detail for single content assignment
          try {
            const res = await fetch(API_ENDPOINTS.CONTENT_DETAIL(content.id));
            if (res.ok) {
              const detail: ContentDetail = await res.json();
              setSelectedContent(detail);
            }
          } catch (err) {
            console.error("Failed to fetch content detail:", err);
          }
          setContentPickerOpen(false);
        }}
      />

      {/* Content Picker for multi-activity builder */}
      <ContentPickerModal
        open={contentPickerForActivity !== null}
        onClose={() => setContentPickerForActivity(null)}
        onSelect={(content) => {
          if (contentPickerForActivity) {
            updateActivity(contentPickerForActivity, {
              content,
              content_id: content.id,
            });
            setContentPickerForActivity(null);
          }
        }}
      />

      {/* Standard Picker for multi-activity builder */}
      <StandardPickerModal
        open={standardPickerForActivity !== null}
        onClose={() => setStandardPickerForActivity(null)}
        onSelect={(standard) => {
          if (standardPickerForActivity) {
            updateActivity(standardPickerForActivity, {
              standard,
              standard_id: standard.id,
            });
            setStandardPickerForActivity(null);
          }
        }}
      />
    </div>
  );
}
