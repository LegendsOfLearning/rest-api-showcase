import type { SearchLegendsInput } from "./types";
import { apiFetch } from "./api-client";

export async function searchLegends(params: SearchLegendsInput): Promise<unknown> {
  const input = params;
  const pageSize = input.pageSize ?? input.limit ?? 5;

  const body: Record<string, unknown> = {
    q: input.query,
    page: input.page ?? 1,
    page_size: pageSize,
  };
  // Only pass content_type when it matches server enum
  const allowed = new Set(["game", "video", "hands_on", "standard"]);
  if (input.contentType && allowed.has(input.contentType)) {
    body.content_type = input.contentType;
  }
  if (input.gameTypes && input.gameTypes.length > 0) {
    body.game_types = input.gameTypes;
  }
  if (input.gradeLevels && input.gradeLevels.length > 0) body.grade_levels = input.gradeLevels;

  return apiFetch('/searches', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

