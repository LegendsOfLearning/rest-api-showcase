import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const currentPath = router.pathname

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">
            Legends of Learning API Demo
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="prose max-w-none">
            <p className="text-gray-700">
              This demo shows how to integrate with the Legends of Learning API using OAuth 2.0 
              authentication and API proxying.
            </p>
            <p className="text-gray-700">
              The server handles authentication and proxies requests to the Legends API.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/games"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                currentPath === '/games'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Games
            </Link>
            <Link
              href="/standards"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                currentPath === '/standards'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Standards
            </Link>
            <Link
              href="/assignments"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                currentPath === '/assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignments
            </Link>
          </nav>
        </div>

        {/* Page Content */}
        <div className="mt-6">
          {children}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm">
            &copy; {new Date().getFullYear()} Legends of Learning API Demo
          </p>
        </div>
      </footer>
    </div>
  )
} 