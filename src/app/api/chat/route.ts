import { NextRequest } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { tool, streamText, zodSchema, convertToModelMessages } from "ai";
import { getSystemPrompt } from "@/lib/chat/system-prompt";
import { searchLegends } from "@/lib/chat/tools/search-legends";
import { previewContent } from "@/lib/chat/tools/preview-content";
import { assembleAssignment } from "@/lib/chat/tools/assemble-assignment";
import { createJoinLink } from "@/lib/chat/tools/create-join-link";
import { previewPlay } from "@/lib/chat/tools/preview-play";
import type { SearchLegendsInput, PreviewContentInput, AssembleAssignmentInput } from "@/lib/chat/tools/types";
import type { CreateJoinLinkInput } from "@/lib/chat/tools/types";
import {
  searchLegendsSchema,
  previewContentSchema,
  assembleAssignmentSchema,
  createJoinLinkSchema,
  previewPlaySchema,
} from "@/lib/chat/tools/types";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. Chat functionality will not work.");
}

const searchLegendsTool = tool({
  description:
    "Search Legends with facets. Use `query` plus optional `contentType` ('content'|'standard'), `gradeLevels` (['k','1',...]), and pagination (`page`, `pageSize`).",
  inputSchema: zodSchema(searchLegendsSchema),
  execute: async (input: SearchLegendsInput) => {
    console.log("[tool:searchLegends] input", input);
    try {
      const out = await searchLegends(input);
      if (typeof out === "object" && out) {
        const keys = Object.keys(out as Record<string, unknown>).slice(0, 6);
        console.log("[tool:searchLegends] output keys", keys);
      } else {
        console.log("[tool:searchLegends] output type", typeof out);
      }
      return out;
    } catch (err) {
      console.error("[tool:searchLegends] error", err);
      throw err;
    }
  },
});

const previewContentTool = tool({
  description: "Preview a legends game or video by content ID.",
  inputSchema: zodSchema(previewContentSchema),
  execute: async (input: PreviewContentInput) => {
    console.log("[tool:previewContent] input", input);
    try {
      const out = await previewContent(input);
      if (typeof out === "object" && out) {
        const keys = Object.keys(out as Record<string, unknown>).slice(0, 6);
        console.log("[tool:previewContent] output keys", keys);
      } else {
        console.log("[tool:previewContent] output type", typeof out);
      }
      return out;
    } catch (err) {
      console.error("[tool:previewContent] error", err);
      throw err;
    }
  },
});

const assembleAssignmentTool = tool({
  description: "Assemble an assignment with one or more activities (games, videos, etc).",
  inputSchema: zodSchema(assembleAssignmentSchema),
  execute: async (input: AssembleAssignmentInput) => {
    console.log("[tool:assembleAssignment] input", { title: input.title, activities: input.activities?.length });
    try {
      const out = await assembleAssignment(input);
      if (typeof out === "object" && out) {
        const idVal = (out as Record<string, unknown>)["assignment_id"];
        console.log("[tool:assembleAssignment] output", { assignment_id: typeof idVal === "number" ? idVal : undefined });
      } else {
        console.log("[tool:assembleAssignment] output type", typeof out);
      }
      return out;
    } catch (err) {
      console.error("[tool:assembleAssignment] error", err);
      throw err;
    }
  },
});

const createJoinLinkTool = tool({
  description: "Create a join link for an assignment (optionally for 'web' or 'awakening', defaults to 'web').",
  inputSchema: zodSchema(createJoinLinkSchema),
  execute: async (input: CreateJoinLinkInput) => {
    console.log("[tool:createJoinLink] input", input);
    try {
      const out = await createJoinLink(input);
      if (typeof out === "object" && out) {
        console.log("[tool:createJoinLink] output keys", Object.keys(out as Record<string, unknown>));
      } else {
        console.log("[tool:createJoinLink] output type", typeof out);
      }
      return out;
    } catch (err) {
      console.error("[tool:createJoinLink] error", err);
      throw err;
    }
  },
});

const previewPlayTool = tool({
  description: "Create a one-activity preview assignment for content and return a join link (web/awakening/both).",
  inputSchema: zodSchema(previewPlaySchema),
  execute: previewPlay,
});

export const runtime = "nodejs";

const SUPPORTED: ReadonlyArray<string> = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-4",
];

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = await req.json();

  const cookieModel = req.cookies.get("llm-model")?.value;
  const modelName = SUPPORTED.includes(cookieModel ?? "") ? cookieModel! : "gpt-4o-mini";

  const rid = Math.random().toString(36).slice(2, 8);
  console.log(`[chat] rid=${rid} model=${modelName} messages=${Array.isArray(messages) ? messages.length : 0}`);

  try {
    const result = streamText({
      model: openai(modelName),
      messages: convertToModelMessages(messages),
      system: getSystemPrompt((process.env.ASSISTANT_PROMPT_MODE as "strict" | "relaxed") || "strict"),
      tools: {
        searchLegends: searchLegendsTool,
        previewContent: previewContentTool,
        previewPlay: previewPlayTool,
        assembleAssignment: assembleAssignmentTool,
        createJoinLink: createJoinLinkTool,
      },
    });
    const resp = result.toUIMessageStreamResponse();
    console.log(`[chat] rid=${rid} streaming started`);
    return resp;
  } catch {
    const fallback = streamText({
      model: openai("gpt-4o-mini"),
      messages: convertToModelMessages(messages),
      system: getSystemPrompt((process.env.ASSISTANT_PROMPT_MODE as "strict" | "relaxed") || "strict"),
      tools: {
        searchLegends: searchLegendsTool,
        previewContent: previewContentTool,
        previewPlay: previewPlayTool,
        assembleAssignment: assembleAssignmentTool,
        createJoinLink: createJoinLinkTool,
      },
    });
    const resp = fallback.toUIMessageStreamResponse();
    console.log(`[chat] rid=${rid} fallback streaming started`);
    return resp;
  }
}

