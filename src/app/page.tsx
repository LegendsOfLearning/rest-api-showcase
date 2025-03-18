import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            One Shot LoL
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Launch standards to students with ease. Manage users and track progress all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/users"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Manage Users
            </Link>
            <Link
              href="/standards"
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              View Standards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
