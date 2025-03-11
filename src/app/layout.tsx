import '../styles/globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legends of Learning REST API Demo',
  description: 'A demo application for the Legends of Learning REST API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-gradient-to-r from-violet-800 to-indigo-700 shadow-lg">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Legends of Learning API
            </h1>
            <div className="hidden sm:block">
              <span className="text-indigo-100 text-sm font-medium">Powered by REST API</span>
            </div>
          </div>
        </header>
        
        <main className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 mb-8 w-full">
            <nav className="-mb-px flex space-x-8">
              <Link
                href="/standards"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 hover:text-indigo-700 hover:border-indigo-300 ${
                  typeof window !== 'undefined' && window.location.pathname === '/standards' 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-slate-600'
                }`}
              >
                Standards
              </Link>
              <Link
                href="/content"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 hover:text-indigo-700 hover:border-indigo-300 ${
                  typeof window !== 'undefined' && window.location.pathname === '/content' 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-slate-600'
                }`}
              >
                Content
              </Link>
              <Link
                href="/assignments"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 hover:text-indigo-700 hover:border-indigo-300 ${
                  typeof window !== 'undefined' && window.location.pathname === '/assignments' 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-slate-600'
                }`}
              >
                Assignments
              </Link>
              <Link
                href="/users"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 hover:text-indigo-700 hover:border-indigo-300 ${
                  typeof window !== 'undefined' && window.location.pathname === '/users' 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-slate-600'
                }`}
              >
                Users
              </Link>
              <Link
                href="/search"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 hover:text-indigo-700 hover:border-indigo-300 ${
                  typeof window !== 'undefined' && window.location.pathname === '/search' 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-slate-600'
                }`}
              >
                Search
              </Link>
            </nav>
          </div>

          {/* Page Content */}
          <div className="mt-6">
            {children}
          </div>
        </main>
        
        <footer className="bg-slate-900 text-white py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-300 text-sm">
                &copy; {new Date().getFullYear()} Legends of Learning
              </p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  Documentation
                </a>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
} 