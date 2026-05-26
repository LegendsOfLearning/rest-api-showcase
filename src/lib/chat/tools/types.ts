import { z } from "zod";

function normalizeSearchContentType(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const v = value.trim().toLowerCase();
  if (v === "games") return "game";
  if (v === "videos") return "video";
  if (v === "standards") return "standard";
  if (v === "hands-on" || v === "hands on") return "hands_on";
  // Map assessment/quiz requests to `game` content type; use gameTypes to further filter
  if (v === "assessment" || v === "assessments" || v === "quiz" || v === "quizzes") return "game";
  if (v === "activity" || v === "activities") return "game";
  return v;
}

const gameTypesEnum = z.enum(["instructional", "quiz", "simulation"]);

export const searchLegendsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  // Additional facets aligned with the OpenAPI spec (accept common synonyms)
  contentType: z
    .preprocess(normalizeSearchContentType, z.enum(["standard", "game", "video", "hands_on"]))
    .optional(),
  gameTypes: z.array(gameTypesEnum).optional(),
  gradeLevels: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
  // Back-compat alias for pageSize
  limit: z.number().int().min(1).max(50).optional(),
});

export type SearchLegendsInput = z.infer<typeof searchLegendsSchema>;

export const previewContentSchema = z.object({
  contentType: z.enum(["game", "video"]),
  contentId: z.string().min(1, "contentId is required"),
});

export type PreviewContentInput = z.infer<typeof previewContentSchema>;

export const previewPlaySchema = z.object({
  contentId: z.union([z.string(), z.number()]),
  target: z.enum(["web", "awakening", "both"]).optional(),
});

export type PreviewPlayInput = z.infer<typeof previewPlaySchema>;

export const assembleAssignmentSchema = z.object({
  title: z.string().min(1, "Assignment title is required"),
  objectives: z.array(z.string()).default([]),
  activities: z
    .array(
      z.object({
        id: z.string().min(1, "activity id is required"),
        type: z.enum(["game", "video", "discussion", "assessment"]),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one activity is required"),
  // Optional: automatically create a join link after creation
  joinAfter: z.boolean().optional(),
  joinTarget: z.enum(["web", "awakening", "both"]).optional(),
});

export type AssembleAssignmentInput = z.infer<typeof assembleAssignmentSchema>;

// Join link schema
export const createJoinLinkSchema = z.object({
  assignmentId: z.union([z.string(), z.number()]),
  applicationUserId: z.string().optional(), // if omitted, will provision a new student
  target: z.enum(["awakening", "web", "both"]).default("web"),
});

export type CreateJoinLinkInput = z.infer<typeof createJoinLinkSchema>;

