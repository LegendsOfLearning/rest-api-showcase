"use client";

import { FormEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useChat, UIMessage } from "@ai-sdk/react";
import { cn } from "@/lib/chat/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import Image from "next/image";

function setCookie(name: string, value: string, days = 365) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
  } catch {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type ChatMessage = UIMessage & {
  content?: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I can help you explore Legends content. Ask me to search standards, preview games or videos, and assemble assignments.",
  parts: [],
};

function isTextPart(part: unknown): part is { type: "text"; text: string } {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type: unknown }).type === "text" &&
    "text" in part &&
    typeof (part as { text: unknown }).text === "string"
  );
}

function getProp<T extends string>(part: unknown, key: T): unknown | undefined {
  if (typeof part === "object" && part !== null && key in (part as Record<string, unknown>)) {
    return (part as Record<string, unknown>)[key];
  }
  return undefined;
}

function deriveAssistantSummaryFromParts(parts: unknown[]): string | undefined {
  for (const part of parts) {
    if (!isRecord(part) || typeof (part as { type?: unknown }).type !== "string") continue;
    const type = (part as { type: string }).type;

    const state = (getProp(part, "state") as string | undefined) ?? (type === "tool-output-error" ? "output-error" : type === "tool-output-available" ? "output-available" : undefined);
    const toolName = (getProp(part, "toolName") as string | undefined) ?? (type.startsWith("tool-") ? type.replace(/^tool-/, "") : undefined);

    if (state === "output-error") {
      const errText = getProp(part, "errorText");
      if (typeof errText === "string") {
        return `There was an error in ${toolName ?? "a tool"}: ${errText}`;
      }
    }

    if (state === "output-available") {
      const output = getProp(part, "output");

      if (toolName === "searchLegends" && isRecord(output)) {
        const total = typeof output.total_count === "number" ? output.total_count : undefined;
        const hits = Array.isArray(output.hits) ? (output.hits as unknown[]) : [];
        const names: string[] = [];
        for (const h of hits) {
          if (isRecord(h)) {
            const content = getProp(h, "content");
            const standard = getProp(h, "standard");
            if (isRecord(content) && typeof content.name === "string") names.push(content.name as string);
            else if (isRecord(standard) && typeof standard.name === "string") names.push(standard.name as string);
          }
        }
        const list = names.slice(0, 5).map((n, i) => `${i + 1}. ${n}`).join("\n");
        return `Found ${total ?? names.length} results. Top matches:\n${list}\n\nWould you like me to preview one or build an assignment?`;
      }

      if (toolName === "assembleAssignment" && isRecord(output)) {
        const id = output.assignment_id as unknown;
        if (typeof id === "number") return `Created assignment ${id}. Want me to create a join link?`;
        return `Your assignment has been prepared. Shall I create a join link?`;
      }

      if (toolName === "createJoinLink" && isRecord(output)) {
        const url = output.join_url as unknown;
        if (typeof url === "string") return `Join link ready: ${url}`;
        const urls = output.join_urls as unknown;
        if (isRecord(urls)) {
          const web = typeof urls.web === "string" ? urls.web : undefined;
          const awakening = typeof urls.awakening === "string" ? urls.awakening : undefined;
          if (web || awakening) {
            const lines = [web ? `Web: ${web}` : undefined, awakening ? `Awakening: ${awakening}` : undefined]
              .filter(Boolean)
              .join("\n");
            return `Join links ready:\n${lines}`;
          }
        }
      }

      if (toolName === "previewContent" && isRecord(output)) {
        const title = typeof output.game === "string" ? output.game : (typeof output.short_name === "string" ? output.short_name : undefined);
        const desc = typeof output.description === "string" ? output.description : undefined;
        if (title || desc) return `Previewing: ${title ?? "Content"}${desc ? `\n\n${desc}` : ""}`;
      }
    }
  }
  return undefined;
}

function SearchCards({ parts, onPreview, onAdd }: { parts: unknown[]; onPreview: (id: number) => void; onAdd: (id: number) => void }) {
  const cards: { id: number; title: string; desc?: string; thumb?: string }[] = [];
  for (const part of parts) {
    if (!isRecord(part)) continue;
    const t = (getProp(part, "type") as string) ?? "";
    const state = (getProp(part, "state") as string) ?? "";
    const name = (getProp(part, "toolName") as string) ?? (t.startsWith("tool-") ? t.replace(/^tool-/, "") : "");
    if ((t === "tool-output-available" || state === "output-available") && name === "searchLegends") {
      const out = getProp(part, "output");
      if (!isRecord(out)) continue;
      const hits = getProp(out, "hits");
      if (!Array.isArray(hits)) continue;
      for (const h of hits) {
        if (!isRecord(h)) continue;
        const content = getProp(h, "content");
        if (!isRecord(content)) continue;
        const id = content.id as unknown;
        const title = (content.name as string) ?? "";
        const desc = (content.description as string) ?? undefined;
        const thumb = (content.thumbnail_url as string) ?? undefined;
        if (typeof id === "number" && typeof title === "string") {
          cards.push({ id, title, desc, thumb });
        }
      }
    }
  }
  if (cards.length === 0) return null;
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <div key={c.id} className="overflow-hidden rounded-lg border border-border bg-surface-100">
          {c.thumb ? (
            <div className="relative h-40 w-full">
              <Image src={c.thumb} alt={c.title} fill className="object-cover"/>
            </div>
          ) : (
            <div className="h-40 w-full bg-surface-200" />
          )}
          <div className="p-3">
            <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
            {c.desc ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted">{c.desc}</p>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <button
                className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-surface-200"
                onClick={() => onPreview(c.id)}
              >
                Preview
              </button>
              <button
                className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-on-accent hover:opacity-90"
                onClick={() => onAdd(c.id)}
              >
                Add to assignment
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatPage() {
  const { messages, sendMessage, status, stop, error } = useChat<ChatMessage>({
    id: "legends-chat",
  });

  const [input, setInput] = useState("");
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [debug, setDebug] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [pendingActivities, setPendingActivities] = useState<number[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text?: string } | undefined;
      const text = detail?.text;
      if (!text || status !== "ready") return;
      setInput("");
      void sendMessage({ role: "user", content: text, parts: [{ type: "text", text }] });
    };
    window.addEventListener("chat-intent", handler as EventListener);
    return () => window.removeEventListener("chat-intent", handler as EventListener);
  }, [sendMessage, status]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("legends_debug");
      if (stored != null) setDebug(stored === "1");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("legends_debug", debug ? "1" : "0");
    } catch {}
  }, [debug]);

  useEffect(() => {
    try {
      const storedModel = localStorage.getItem("llm-model");
      if (storedModel) {
        setModel(storedModel);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("llm-model", model);
      setCookie("llm-model", model);
    } catch {}
  }, [model]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const displayMessages = useMemo(() => {
    if (messages.length === 0) {
      return [WELCOME_MESSAGE];
    }

    return messages.map((message) => {
      const textContent = message.parts.filter(isTextPart).map((part) => part.text).join(" ");
      let content = textContent;
      if (!content && message.role === "assistant" && Array.isArray(message.parts)) {
        const derived = deriveAssistantSummaryFromParts(message.parts as unknown[]);
        if (derived) content = derived;
      }
      return { ...message, content };
    });
  }, [messages]);

  const editingIndex = useMemo(() => {
    return editingMessageId ? displayMessages.findIndex((m) => m.id === editingMessageId) : -1;
  }, [editingMessageId, displayMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [displayMessages, editingMessageId]);

  useEffect(() => {
    if (error) {
      setShowErrorBanner(true);
    }
  }, [error]);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (editingMessageId) {
      if (!editingText.trim()) return;
      void sendMessage({ role: "user", content: editingText, parts: [{ type: "text", text: editingText }] });
      setEditingMessageId(null);
      setEditingText("");
      return;
    }
    if (!input.trim()) return;
    const text = input;
    setInput("");
    void sendMessage({ role: "user", content: text, parts: [{ type: "text", text }] });
  };

  const startEdit = (message: ChatMessage) => {
    const text = message.content || "";
    setEditingMessageId(message.id);
    setEditingText(text);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const SUGGESTIONS: string[] = [
    "Search photosynthesis games",
    "Search standards for grade 6 math",
    "Build a 2-game photosynthesis assignment",
    "Create a join link for my latest assignment",
  ];

  const onSuggestionClick = (text: string) => {
    if (status !== "ready") return;
    setInput("");
    void sendMessage({ role: "user", content: text, parts: [{ type: "text", text }] });
  };

  const addActivity = (id: number) => {
    setPendingActivities((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeActivity = (id: number) => {
    setPendingActivities((prev) => prev.filter((x) => x !== id));
  };

  const clearActivities = () => setPendingActivities([]);

  const createAssignmentFromPending = () => {
    if (status !== "ready" || pendingActivities.length < 2) return;
    const list = pendingActivities.map((id) => `{ content_id: ${id} }`).join(", ");
    const text = `Create a multi-activity assignment with: [${list}] and provide a join link.`;
    setInput("");
    void sendMessage({ role: "user", content: text, parts: [{ type: "text", text }] });
    clearActivities();
  };

  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    if (pendingActivities.length === 0 && cartOpen) setCartOpen(false);
  }, [pendingActivities.length, cartOpen]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Chat Assistant</h1>
            <span className="inline-flex items-center rounded-full border border-warning bg-warning px-2 py-0.5 text-xs font-medium text-warning">Alpha</span>
          </div>
          <p className="text-sm text-muted mt-1">Ask me to search content, preview games, or build assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
            <span>Model</span>
            <select
              className="rounded-md border border-border bg-surface-100 px-2 py-1 text-xs text-foreground focus:outline-none"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="gpt-4o-mini">gpt-4o-mini (default)</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
              <option value="gpt-4">gpt-4</option>
            </select>
          </div>
          {editingMessageId ? (
            <span className="rounded bg-warning px-2 py-1 text-xs text-warning">Editing…</span>
          ) : null}
          <button
            type="button"
            onClick={() => setDebug((d) => !d)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition",
              debug ? "bg-accent" : "bg-surface-200"
            )}
            aria-label="Toggle debug"
            aria-pressed={debug}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-surface shadow transition",
                debug ? "translate-x-5" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6 min-h-0">
        <section className="flex min-w-0 flex-1 flex-col min-h-0">
          {messages.length === 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestionClick(s)}
                  disabled={status !== "ready"}
                  className={cn(
                    "inline-flex max-w-full items-center justify-center rounded-full border border-border bg-surface-100 px-3 py-1 text-xs text-foreground hover:bg-surface-200",
                    "whitespace-nowrap",
                    status !== "ready" && "opacity-60 cursor-not-allowed"
                  )}
                  aria-label={`Try: ${s}`}
                  title={s}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          {showErrorBanner && error ? (
            <div className="relative mb-4 rounded-md bg-error p-4 text-sm text-error">
              <p className="font-medium">
                {debug ? `Error: ${error.message}` : "Something went wrong. Please try again."}
              </p>
              <button
                className="absolute right-2 top-2 rounded-full p-1 text-error hover:bg-surface-100"
                onClick={() => setShowErrorBanner(false)}
              >
                &times;
              </button>
            </div>
          ) : null}

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-6 lg:pr-2 min-h-0">
            {displayMessages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                debug={debug}
                isEditing={editingMessageId === message.id}
                dimBelow={editingIndex >= 0 && index > editingIndex}
                editingText={editingText}
                onEdit={() => startEdit(message)}
                onChangeEditingText={setEditingText}
                onSave={() => {
                  if (!editingText.trim()) return;
                  void sendMessage({ role: "user", content: editingText, parts: [{ type: "text", text: editingText }] }).then(() => {
                    setEditingMessageId(null);
                    setEditingText("");
                  });
                }}
                onCancel={cancelEdit}
                onAddActivity={(id) => addActivity(id)}
                onPreviewContent={(id) => {
                  const text = `Preview content ${id}`;
                  const ev = new CustomEvent("chat-intent", { detail: { text } });
                  window.dispatchEvent(ev);
                }}
              />
            ))}

            {status !== "ready" ? (
              <ThinkingBubble />
            ) : null}
            <div aria-live="polite" className="sr-only">{status !== "ready" ? "Assistant is thinking" : ""}</div>
          </div>

          {pendingActivities.length > 0 ? (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="fixed bottom-28 right-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg lg:hidden"
              aria-label="Open Assignment Builder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M3 3h2l2.68 12.39A2 2 0 0 0 9.62 17H18a2 2 0 0 0 1.94-1.52L22 7H6" />
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
            </button>
          ) : null}

          {cartOpen && pendingActivities.length > 0 ? (
            <div className="fixed inset-0 z-30 flex lg:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
              <div className="relative ml-auto h-full w-80 max-w-[85%] bg-surface p-4 shadow-xl ring-1 ring-border">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">Assignment Builder</h2>
                  <button onClick={() => setCartOpen(false)} className="rounded-md p-1 text-muted hover:bg-surface-100" aria-label="Close">
                    ×
                  </button>
                </div>
                <AssignmentCart
                  items={pendingActivities}
                  onRemove={removeActivity}
                  onClear={clearActivities}
                  onCreate={() => {
                    setCartOpen(false);
                    createAssignmentFromPending();
                  }}
                  ready={pendingActivities.length >= 2 && status === "ready"}
                />
              </div>
            </div>
          ) : null}

          <ExpandingComposer
            value={input}
            onChange={setInput}
            onSubmit={onSubmit}
            disabled={!!editingMessageId}
            placeholder={editingMessageId ? "Editing above…" : "Ask for legends content, a preview, or build an assignment..."}
            status={status}
            stop={stop}
          />
        </section>

        {pendingActivities.length > 0 ? (
          <aside className="hidden lg:block lg:w-80 lg:shrink-0">
            <AssignmentCart
              items={pendingActivities}
              onRemove={removeActivity}
              onClear={clearActivities}
              onCreate={createAssignmentFromPending}
              ready={pendingActivities.length >= 2 && status === "ready"}
            />
          </aside>
        ) : null}

      </div>
    </div>
  );
}

type Message = ChatMessage;

type MessageBubbleProps = {
  message: Message;
  debug: boolean;
  isEditing: boolean;
  dimBelow: boolean;
  editingText: string;
  onEdit: () => void;
  onChangeEditingText: (t: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddActivity: (id: number) => void;
  onPreviewContent: (id: number) => void;
};

function MessageBubble({ message, debug, isEditing, dimBelow, editingText, onEdit, onChangeEditingText, onSave, onCancel, onAddActivity, onPreviewContent }: MessageBubbleProps) {
  const { role, parts, content } = message;
  const alignEnd = role === "user";

  const join = useMemo(() => {
    if (!parts) return undefined as
      | { kind: "single"; url: string }
      | { kind: "multiple"; urls: { web?: string; awakening?: string } }
      | undefined;
    for (const part of parts as unknown[]) {
      if (isRecord(part) && typeof (part as { type?: unknown }).type === "string") {
        const t = (part as { type: string }).type;
        const state = (getProp(part, "state") as string | undefined) ?? "";
        if (t === "tool-output-available" || state === "output-available") {
          const output = getProp(part, "output");
          if (isRecord(output)) {
            const single = output.join_url;
            const multi = output.join_urls as { web?: string; awakening?: string } | undefined;
            if (typeof single === "string") {
              return { kind: "single", url: single } as const;
            }
            if (isRecord(multi) && (typeof multi.web === "string" || typeof multi.awakening === "string")) {
              return { kind: "multiple", urls: { web: multi.web as string | undefined, awakening: multi.awakening as string | undefined } } as const;
            }
          }
        }
      }
    }
    return undefined;
  }, [parts]);

  return (
    <div className={cn("flex", alignEnd ? "justify-end" : "justify-start", dimBelow && "opacity-50 pointer-events-none")}> 
      <div
        className={cn(
          "max-w-2xl rounded-xl border px-4 py-3 text-sm shadow-sm",
          alignEnd
            ? "bg-accent text-on-accent border-accent"
            : "bg-surface-100 text-foreground border-border"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {isEditing && role === "user" ? (
              <div>
                <textarea
                  value={editingText}
                  onChange={(e) => onChangeEditingText(e.target.value)}
                  className={cn(
                    "w-full resize-vertical rounded-md border bg-transparent p-2 outline-none",
                    alignEnd ? "border-on-accent/50 text-on-accent placeholder:text-on-accent/60" : "border-border text-foreground placeholder:text-muted"
                  )}
                  rows={Math.max(3, Math.min(10, Math.ceil((editingText.length || 1) / 60)))}
                  placeholder="Edit your message..."
                  autoFocus
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSave}
                    className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-on-accent hover:opacity-90"
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-surface-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : role === "assistant" && content ? (
              <div className="prose prose-invert max-w-none text-foreground prose-p:my-2 prose-ul:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              content && <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
            )}

            {join ? (
              <div className="mt-3">
                {join.kind === "single" ? (
                  <JoinLinkCard url={join.url} />
                ) : (
                  <JoinLinkMultiCard urls={join.urls} />
                )}
              </div>
            ) : null}

            {parts && parts.length > 0 ? (
              <SearchCards
                parts={parts as unknown[]}
                onPreview={(id) => onPreviewContent(id)}
                onAdd={(id) => onAddActivity(id)}
              />
            ) : null}
          </div>
          {role === "user" && !isEditing ? (
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                "shrink-0 rounded-md border p-1",
                alignEnd ? "border-on-accent/50 text-on-accent hover:bg-on-accent/20" : "border-border text-muted hover:bg-surface-200"
              )}
              aria-label="Edit message"
              title="Edit message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712zM3 17.25V21h3.75l10.9-10.9-3.712-3.712L3 17.25z" />
              </svg>
              <span className="sr-only">Edit</span>
            </button>
          ) : null}
        </div>

        <div className={cn("mt-3 space-y-2 text-xs text-muted", !debug && "hidden")}
             aria-hidden={!debug}
             aria-expanded={debug}
        >
          {parts && parts.length > 0
            ? parts.map((part, index) => {
                if (isRecord(part) && (part as { type?: unknown }).type === "tool-input-available") {
                  const args = getProp(part, "input");
                  const name = getProp(part, "toolName") as string | undefined;
                  return <ToolAnnotation key={index} annotation={{ role: "tool", name, args }} />;
                }
                if (isRecord(part) && (part as { type?: unknown }).type === "tool-output-error") {
                  const args = getProp(part, "errorText");
                  const name = getProp(part, "toolName") as string | undefined;
                  return <ToolAnnotation key={index} annotation={{ role: "tool", name, args }} isError={true} />;
                }
                if (isRecord(part) && (part as { type?: unknown }).type === "tool-output-available") {
                  const args = getProp(part, "output");
                  const name = getProp(part, "toolName") as string | undefined;
                  return <ToolAnnotation key={index} annotation={{ role: "tool", name, args }} />;
                }
                return null;
              })
            : null}

          {parts && parts.length > 0 ? (
            <div className="rounded-md border border-border bg-surface-100 p-2">
              <p className="mb-1 font-medium text-foreground">Raw debug</p>
              <pre className="max-h-64 overflow-auto text-muted">{JSON.stringify(parts, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type ExpandingComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  placeholder: string;
  disabled?: boolean;
  status: "ready" | "streaming" | string;
  stop: () => void;
};

function ExpandingComposer({ value, onChange, onSubmit, placeholder, disabled, status, stop }: ExpandingComposerProps) {
  const isMulti = value.includes("\n");
  const rows = Math.min(8, Math.max(1, value.split("\n").length));
  const styles = useSpring({
    height: isMulti ? Math.max(56, 20 + rows * 20) : 56,
    config: { tension: 240, friction: 26, clamp: true },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      formRef.current?.requestSubmit();
      return;
    }
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="sticky bottom-0 py-4">
      <animated.div style={styles} className={cn("rounded-2xl border border-border bg-surface-100 p-2 will-change-[height]")}> 
        <div className="flex items-end gap-2">
          <textarea
            className="max-h-56 min-h-[2.5rem] flex-1 resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={isMulti ? rows : 1}
            disabled={!!disabled}
          />
          <button
            className="inline-flex h-10 min-h-[2.5rem] items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={status !== "ready"}
            aria-label="Send"
          >
            {status !== "ready" ? "Thinking" : "Send"}
          </button>
          {status !== "ready" ? (
            <button
              className="inline-flex h-10 min-h-[2.5rem] items-center justify-center rounded-xl border border-border px-4 text-sm text-foreground hover:bg-surface-200"
              type="button"
              onClick={stop}
            >
              Stop
            </button>
          ) : null}
        </div>
      </animated.div>
    </form>
  );
}

type ToolAnnotationProps = {
  annotation: {
    role: string;
    name?: string;
    args?: unknown;
  };
  isError?: boolean;
};

function ToolAnnotation({ annotation, isError = false }: ToolAnnotationProps) {
  if (annotation.role !== "tool") return null;

  return (
    <div className={cn("rounded-md border px-3 py-2", isError ? "border-error bg-error" : "border-border bg-surface-100")}>
      <p className="font-medium text-foreground">
        Tool call: <span className={cn(isError ? "text-error" : "text-accent")}>{annotation.name ?? "tool"}</span>
      </p>
      {annotation.args ? (
        <pre className="mt-1 whitespace-pre-wrap break-all text-muted">{JSON.stringify(annotation.args, null, 2)}</pre>
      ) : null}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="relative max-w-2xl rounded-xl border border-border bg-surface-100 px-4 py-3 text-sm text-foreground shadow-sm transition-opacity duration-300 ease-out animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="relative h-5 w-5">
            <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-accent/60" />
            <span className="relative inline-flex h-5 w-5 rounded-full bg-accent/80" />
          </div>
          <span>Thinking…</span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <span className="h-1 w-1 animate-bounce rounded-full bg-muted [animation-delay:-200ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-muted [animation-delay:-100ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

function JoinLinkCard({ url }: { url: string }) {
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  };
  return (
    <div className="portal-alert-success flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide">Join Link Ready</p>
        <a href={url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-sm font-medium hover:underline">
          {url}
        </a>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button onClick={onCopy} className="rounded-md border border-success px-3 py-1 text-xs hover:opacity-80">
          Copy
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-on-accent hover:bg-accent-hover">
          Open
        </a>
      </div>
    </div>
  );
}

function JoinLinkMultiCard({ urls }: { urls: { web?: string; awakening?: string } }) {
  const onCopy = async (val?: string) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
    } catch {}
  };
  return (
    <div className="portal-alert-success p-3">
      <p className="text-xs uppercase tracking-wide">Join Links</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {urls.web ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-success bg-success p-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide">Web</p>
              <a href={urls.web} target="_blank" rel="noreferrer" className="block truncate text-xs hover:underline">
                {urls.web}
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => onCopy(urls.web)} className="rounded-md border border-success px-2 py-1 text-[10px] hover:opacity-80">
                Copy
              </button>
              <a href={urls.web} target="_blank" rel="noreferrer" className="rounded-md bg-accent px-2 py-1 text-[10px] font-medium text-on-accent hover:bg-accent-hover">
                Open
              </a>
            </div>
          </div>
        ) : null}
        {urls.awakening ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-success bg-success p-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide">Awakening</p>
              <a href={urls.awakening} target="_blank" rel="noreferrer" className="block truncate text-xs hover:underline">
                {urls.awakening}
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => onCopy(urls.awakening)} className="rounded-md border border-success px-2 py-1 text-[10px] hover:opacity-80">
                Copy
              </button>
              <a href={urls.awakening} target="_blank" rel="noreferrer" className="rounded-md bg-accent px-2 py-1 text-[10px] font-medium text-on-accent hover:bg-accent-hover">
                Open
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AssignmentCart({ items, onRemove, onClear, onCreate, ready }: {
  items: number[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onCreate: () => void;
  ready: boolean;
}) {
  return (
    <div className="sticky top-20 space-y-3">
      <div className="rounded-xl border border-border bg-surface-100 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Assignment Builder</h3>
          <span className="text-xs text-muted">{items.length} item{items.length === 1 ? "" : "s"}</span>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted">Add activities from search to build your assignment.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-auto pr-1">
            {items.map((id) => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-200 px-2 py-1 text-xs">
                <span className="truncate">Activity #{id}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted hover:bg-surface-100"
                  aria-label="Remove"
                  onClick={() => onRemove(id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-surface-200"
            onClick={onClear}
            disabled={items.length === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-on-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onCreate}
            disabled={!ready}
          >
            Create
          </button>
        </div>
        <p className="mt-1 text-[10px] text-muted">Add at least 2 activities to proceed.</p>
      </div>
    </div>
  );
}
