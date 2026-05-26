import { apiFetch, ensureUser } from "./api-client";
import type { PreviewPlayInput } from "./types";

function generateLocalDeviceId(): string {
  const g = globalThis as unknown as { __LEGENDS_APP_USER_ID?: string };
  if (!g.__LEGENDS_APP_USER_ID) {
    g.__LEGENDS_APP_USER_ID = `teacher-${Math.random().toString(36).slice(2, 10)}`;
  }
  return g.__LEGENDS_APP_USER_ID;
}

export async function previewPlay(params: PreviewPlayInput): Promise<{ join_url?: string; join_urls?: { web?: string; awakening?: string } }> {
  const contentId = Number(params.contentId);
  if (!Number.isFinite(contentId)) throw new Error("Invalid contentId");

  const applicationUserId = process.env.LEGENDS_APPLICATION_USER_ID ?? generateLocalDeviceId();
  await ensureUser(applicationUserId, 'teacher');

  // Create single-activity assignment
  const createRes = await apiFetch<{ assignment_id: number }>('/assignments', {
    method: "POST",
    body: JSON.stringify({
      application_user_id: applicationUserId,
      name: `Preview ${contentId}`,
      activities: [{ content_id: contentId }],
    }),
  });
  const { assignment_id } = createRes;

  // Create join link(s)
  const doJoin = async (target: "web" | "awakening") => {
    const r = await apiFetch<{ join_url: string }>(`/assignments/${assignment_id}/joins`, {
      method: "POST",
      body: JSON.stringify({ application_user_id: applicationUserId, target }),
    });
    return r.join_url;
  };

  const target = params.target ?? "web";
  if (target === "both") {
    const [web, awakening] = await Promise.all([doJoin("web"), doJoin("awakening")]);
    return { join_urls: { web, awakening } };
  }
  const single = await doJoin(target);
  return { join_url: single };
}

