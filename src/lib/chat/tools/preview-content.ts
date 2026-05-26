import type { PreviewContentInput } from "./types";
import { apiFetch } from "./api-client";

export async function previewContent(
  params: PreviewContentInput
): Promise<unknown> {
  const input = params;
  // Use the proxy route for content endpoint
  return apiFetch(`/content/${input.contentId}`, {
    headers: { Accept: "application/json" },
  });
}

