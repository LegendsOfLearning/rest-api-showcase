import { readFile } from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-static";

export default async function DocsPage() {
  const content = await readFile(path.join(process.cwd(), "docs/api-documentation.md"), "utf8");
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="card text-sm text-muted">
        Maintained public reference · <a className="text-primary underline" href="https://github.com/LegendsOfLearning/rest-api-showcase/blob/main/docs/api-documentation.md">Read or copy the same guide on GitHub</a>
      </div>
      <article className="api-docs rounded-xl border border-border bg-surface p-6 sm:p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
