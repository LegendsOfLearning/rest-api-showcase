import { readFile } from "node:fs/promises";
import path from "node:path";
import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function headingText(children: ReactNode): string {
  return Children.toArray(children).map(child => typeof child === 'string' || typeof child === 'number' ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? headingText(child.props.children) : '').join('');
}
function headingId(children: ReactNode) { return headingText(children).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }

export const dynamic = "force-static";

export default async function DocsPage() {
  const content = await readFile(path.join(process.cwd(), "docs/api-documentation.md"), "utf8");
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="card text-sm text-muted">
        <a className="text-primary underline" href="https://console.legendsoflearning.com/docs">All developer guides</a> · <a className="text-primary underline" href="/demo/fluency">Fluency demo</a> · <a className="text-primary underline" href="https://github.com/LegendsOfLearning/rest-api-showcase/blob/main/docs/api-documentation.md">Read or copy the same guide on GitHub</a>
      </div>
      <article className="api-docs rounded-xl border border-border bg-surface p-6 sm:p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h2: ({children}) => <h2 id={headingId(children)} className="scroll-mt-24">{children}</h2>, h3: ({children}) => <h3 id={headingId(children)} className="scroll-mt-24">{children}</h3> }}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
