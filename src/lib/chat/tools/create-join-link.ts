import type { CreateJoinLinkInput } from "./types";
import { apiFetch, ensureUser } from "./api-client";

type JoinLinkResponse = {
  join_url?: string;
  join_urls?: { web?: string; awakening?: string };
};

function generateLocalStudentId(): string {
  const g = globalThis as unknown as { __LEGENDS_STUDENT_ID?: string };
  if (!g.__LEGENDS_STUDENT_ID) {
    g.__LEGENDS_STUDENT_ID = `student-${Math.random().toString(36).slice(2, 10)}`;
  }
  return g.__LEGENDS_STUDENT_ID;
}

export async function createJoinLink(
  params: CreateJoinLinkInput
): Promise<JoinLinkResponse> {
  const assignmentId = Number(params.assignmentId);
  if (!Number.isFinite(assignmentId)) {
    throw new Error("Invalid assignmentId");
  }

  const applicationUserId = params.applicationUserId ?? generateLocalStudentId();
  await ensureUser(applicationUserId, 'student');

  const doJoin = async (target: "web" | "awakening") => {
    const response = await apiFetch<{ join_url: string }>(
      `/assignments/${assignmentId}/joins`,
      {
        method: "POST",
        body: JSON.stringify({ application_user_id: applicationUserId, target }),
      }
    );
    return response.join_url;
  };

  if (params.target === "both") {
    const [web, awakening] = await Promise.all([doJoin("web"), doJoin("awakening")]);
    return { join_urls: { web, awakening } };
  }

  const single = await doJoin(params.target ?? "web");
  return { join_url: single };
}

