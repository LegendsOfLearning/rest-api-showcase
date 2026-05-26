"use client";

import { useMemo } from "react";
import type { BrandingConfig } from "@/types/api";

type TextFieldKey =
  | "display_name"
  | "return_url"
  | "logo_url"
  | "background_color"
  | "image"
  | "loading_text"
  | "footer_text"
  | "time_limit";

type BooleanFieldKey = "footer" | "show_footer_btn" | "sign_up" | "show_logo";

type BrandingDraft = Record<TextFieldKey, string> &
  Record<BooleanFieldKey, boolean | null>;

const TEXT_FIELDS: {
  key: TextFieldKey;
  label: string;
  description: string;
}[] = [
  {
    key: "display_name",
    label: "Display name",
    description: "Shown in branded return CTAs and partner-facing UI.",
  },
  {
    key: "return_url",
    label: "Return URL",
    description: "Destination for return-to-partner buttons.",
  },
  {
    key: "logo_url",
    label: "Logo URL",
    description: "Partner logo used by app and player surfaces.",
  },
  {
    key: "background_color",
    label: "Background color",
    description: "Safe hex color used by branded player surfaces.",
  },
  {
    key: "image",
    label: "Brand image",
    description: "Legacy branded-player image shown on loading overlays.",
  },
  {
    key: "loading_text",
    label: "Loading text",
    description: "Copy shown while the branded player loads.",
  },
  {
    key: "footer_text",
    label: "Footer text",
    description: "Footer copy shown on branded player overlays.",
  },
  {
    key: "time_limit",
    label: "Time limit",
    description: "Milliseconds before the trial timeout overlay appears.",
  },
];

const BOOLEAN_FIELDS: {
  key: BooleanFieldKey;
  label: string;
  description: string;
}[] = [
  {
    key: "footer",
    label: "Show footer",
    description: "Controls branded-player footer visibility.",
  },
  {
    key: "show_footer_btn",
    label: "Show footer button",
    description: "Controls CTA button visibility.",
  },
  {
    key: "sign_up",
    label: "Show sign-up CTA",
    description: "Enables the Legends sign-up CTA when no return URL is used.",
  },
  {
    key: "show_logo",
    label: "Show Legends logo",
    description: "Keeps the Legends logo visible on branded player surfaces.",
  },
];

function stringValue(value: BrandingConfig[keyof BrandingConfig]): string {
  if (value === null || typeof value === "undefined") return "";
  return String(value);
}

function booleanValue(
  value: BrandingConfig[keyof BrandingConfig],
): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function brandingToDraft(branding: BrandingConfig): BrandingDraft {
  return {
    display_name: stringValue(branding.display_name),
    return_url: stringValue(branding.return_url),
    logo_url: stringValue(branding.logo_url),
    background_color: stringValue(branding.background_color),
    image: stringValue(branding.image),
    loading_text: stringValue(branding.loading_text),
    footer_text: stringValue(branding.footer_text),
    time_limit: stringValue(branding.time_limit),
    footer: booleanValue(branding.footer ?? branding.show_footer),
    show_footer_btn: booleanValue(branding.show_footer_btn),
    sign_up: booleanValue(branding.sign_up ?? branding.show_sign_up),
    show_logo: booleanValue(branding.show_logo),
  };
}

function isValidHexColor(value: string): boolean {
  return value.trim() === "" || /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function configuredFieldCount(draft: BrandingDraft): number {
  const textCount = TEXT_FIELDS.filter((field) =>
    draft[field.key].trim(),
  ).length;
  const booleanCount = BOOLEAN_FIELDS.filter(
    (field) => draft[field.key] !== null,
  ).length;

  return textCount + booleanCount;
}

function booleanLabel(value: boolean | null): string {
  if (value === null) return "Inherited";
  return value ? "On" : "Off";
}

export function PartnerVariablesPanel({
  branding,
  appName,
  eyebrow = "Application branding",
  className = "",
  description,
  readOnlyMessage,
}: {
  branding: BrandingConfig | null | undefined;
  appName?: string | null;
  eyebrow?: string;
  className?: string;
  description?: string;
  readOnlyMessage?: string;
}) {
  const draft = useMemo(
    () => (branding ? brandingToDraft(branding) : null),
    [branding],
  );
  const previewStyle = useMemo(() => {
    const color = draft?.background_color.trim();
    return isValidHexColor(color || "") && color
      ? { backgroundColor: color }
      : undefined;
  }, [draft?.background_color]);

  if (!branding || !draft) {
    return (
      <div
        className={`rounded-xl border border-border bg-surface-100 p-5 ${className}`}
      >
        <div className="text-sm font-semibold text-foreground">{eyebrow}</div>
        <p className="mt-2 text-sm text-muted">
          This OAuth application does not currently return branding variables.
        </p>
      </div>
    );
  }

  const configuredCount = configuredFieldCount(draft);

  return (
    <section className={`rounded-xl border border-border bg-surface-100 p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {branding.display_name || appName || branding.code || "Application"}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {description ||
              "Read-only app-level branding returned by the active OAuth application."}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {readOnlyMessage ||
              "Configure branding outside this public sample, then reload the app context."}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-border bg-surface px-3 py-1 text-xs font-mono text-muted">
          {branding.code || "app"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-3 md:grid-cols-2">
          {TEXT_FIELDS.map((field) => {
            const value = draft[field.key].trim();

            return (
              <div
                key={field.key}
                className="rounded-lg border border-border bg-surface px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {field.label}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-muted">
                      {field.description}
                    </div>
                  </div>
                  <span className="rounded-full border border-border bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-muted">
                    {value ? "Set" : "Inherited"}
                  </span>
                </div>
                <div className="mt-3 min-h-9 rounded-md border border-border bg-surface-100 px-3 py-2 text-sm text-foreground">
                  {value || "Inherited"}
                </div>
              </div>
            );
          })}

          {BOOLEAN_FIELDS.map((field) => (
            <div
              key={field.key}
              className="rounded-lg border border-border bg-surface px-3 py-3"
            >
              <div className="text-sm font-medium text-foreground">
                {field.label}
              </div>
              <div className="mt-1 text-xs leading-5 text-muted">
                {field.description}
              </div>
              <div className="mt-3 rounded-md border border-border bg-surface-100 px-3 py-2 text-sm font-semibold text-foreground">
                {booleanLabel(draft[field.key])}
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Preview
              </div>
              <div className="mt-1 text-xs text-muted">
                {configuredCount} fields configured
              </div>
            </div>
            <span className="rounded-full border border-border bg-surface-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
              Read-only
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface-100">
            <div className="p-4" style={previewStyle}>
              <div className="portal-preview-chrome rounded-md px-3 py-2 text-sm font-semibold">
                {draft.display_name ||
                  appName ||
                  branding.code ||
                  "Application"}
              </div>
              {draft.logo_url ? (
                <div className="portal-preview-chrome mt-3 rounded-md p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.logo_url}
                    alt={draft.display_name || "Application logo"}
                    className="max-h-10 max-w-full object-contain"
                  />
                </div>
              ) : null}
              <p className="portal-preview-chrome mt-3 rounded-md px-3 py-2 text-xs leading-5">
                {draft.loading_text || "Loading text preview"}
              </p>
            </div>
            <div className="border-t border-border bg-surface px-3 py-2">
              <div className="truncate text-xs text-muted">
                Return URL:{" "}
                <span className="font-mono text-foreground">
                  {draft.return_url || "Inherited"}
                </span>
              </div>
              <div className="mt-1 truncate text-xs text-muted">
                Footer:{" "}
                <span className="font-medium text-foreground">
                  {booleanLabel(draft.footer)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <details className="mt-4 rounded-lg border border-border bg-surface">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">
          Raw branding JSON
        </summary>
        <pre className="max-h-72 overflow-auto border-t border-border px-3 py-2 text-xs text-muted">
          {JSON.stringify(branding, null, 2)}
        </pre>
      </details>
    </section>
  );
}
