import { ClientCredentialsLoginForm } from "@/components/auth/ClientCredentialsLoginForm";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/partners";
  return value;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = safeNextPath(firstParam(params.next));
  const clientId = firstParam(params.client_id);
  const appName = firstParam(params.app_name);

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-6 py-10">
      <div className="w-full max-w-md">
        <ClientCredentialsLoginForm
          nextPath={nextPath}
          initialClientId={clientId}
          appName={appName}
        />
      </div>
    </main>
  );
}
