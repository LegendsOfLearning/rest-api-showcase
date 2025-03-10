import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import GameExplorer from '../components/GameExplorer'

export default function GamesPage() {
  const router = useRouter()
  const { subject = 'math' } = router.query
  
  // Set default subject to math if not specified
  useEffect(() => {
    if (!router.query.subject) {
      router.replace({
        pathname: '/games',
        query: { ...router.query, subject: 'math' }
      }, undefined, { shallow: true })
    }
  }, [router])
  
  return (
    <Layout>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push({ pathname: '/games', query: { subject: 'math' } })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subject === 'math' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Math
          </button>
          <button
            onClick={() => router.push({ pathname: '/games', query: { subject: 'science' } })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subject === 'science' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Science
          </button>
          <button
            onClick={() => router.push({ pathname: '/games', query: { subject: 'ela' } })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subject === 'ela' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ELA
          </button>
          <button
            onClick={() => router.push({ pathname: '/games', query: { subject: 'social-studies' } })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subject === 'social-studies' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Social Studies
          </button>
          <button
            onClick={() => router.push('/search')}
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
          >
            Advanced Search
          </button>
        </div>
      </div>
      
      <GameExplorer subject={subject as string} />
    </Layout>
  )
} 