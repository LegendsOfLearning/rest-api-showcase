import type { AssembleAssignmentInput } from "./types";
import { apiFetch, ensureUser } from "./api-client";

type AssignmentCreateResponse = { assignment_id: number };

function generateLocalDeviceId(): string {
  // Persist a random id in memory for node process
  const g = globalThis as unknown as { __LEGENDS_APP_USER_ID?: string };
  if (!g.__LEGENDS_APP_USER_ID) {
    g.__LEGENDS_APP_USER_ID = `teacher-${Math.random().toString(36).slice(2, 10)}`;
  }
  return g.__LEGENDS_APP_USER_ID;
}

export async function assembleAssignment(
  params: AssembleAssignmentInput
): Promise<unknown> {
  const input = params;

  // Ensure the teacher exists based on a device-stable ID
  const appUserId = process.env.LEGENDS_APPLICATION_USER_ID ?? generateLocalDeviceId();
  await ensureUser(appUserId, 'teacher');

  const response = await apiFetch<AssignmentCreateResponse>('/assignments', {
    method: "POST",
    body: JSON.stringify(toV3AssignmentPayload(input, appUserId)),
  });

  const created = response;

  // Optionally create a join link immediately
  if (input.joinAfter) {
    const assignmentId = created.assignment_id;
    if (typeof assignmentId === "number") {
      const target = input.joinTarget ?? "web";
      const requestJoin = async (t: "web" | "awakening") => {
        const jr = await apiFetch<{ join_url: string }>(`/assignments/${assignmentId}/joins`, {
          method: "POST",
          body: JSON.stringify({ application_user_id: appUserId, target: t }),
        });
        return jr.join_url;
      };

      if (target === "both") {
        const [web, awakening] = await Promise.all([requestJoin("web"), requestJoin("awakening")]);
        return { ...created, join_urls: { web, awakening } };
      }
      const j = await requestJoin(target as "web" | "awakening");
      return { ...created, join_url: j };
    }
  }

  return created;
}

function toV3AssignmentPayload(input: AssembleAssignmentInput, applicationUserId: string) {
  return {
    application_user_id: applicationUserId,
    name: input.title,
    activities: input.activities.map((a, idx) => {
      switch (a.type) {
        case "video":
          return { type: "video", content_id: Number(a.id), order: idx + 1 };
        case "game":
          return { type: "mini_game", content_id: Number(a.id), order: idx + 1 };
        case "discussion":
          return { type: "focus", standard_id: Number(a.id), order: idx + 1 };
        case "assessment":
          return { type: "focus_area", standard_id: Number(a.id), order: idx + 1 };
        default:
          return { type: "focus", standard_id: Number(a.id), order: idx + 1 };
      }
    }),
  } as Record<string, unknown>;
}

