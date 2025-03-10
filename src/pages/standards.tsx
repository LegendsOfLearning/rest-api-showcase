import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import StandardsExplorer from '../components/StandardsExplorer'

export default function StandardsPage() {
  const router = useRouter()
  const { standard_set = 'ccss' } = router.query
  
  // Set default standard set to CCSS if not specified
  useEffect(() => {
    if (!router.query.standard_set) {
      router.replace({
        pathname: '/standards',
        query: { ...router.query, standard_set: 'ccss' }
      }, undefined, { shallow: true })
    }
  }, [router])
  
  return (
    <Layout>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push({ pathname: '/standards', query: { standard_set: 'ccss' } })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              standard_set === 'ccss' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Common Core (CCSS)
          </button>
          <button
            onClick={() => router.push({ pathname: '/standards', query: { standard_set: 'ngss' } })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              standard_set === 'ngss' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next Generation (NGSS)
          </button>
          <button
            onClick={() => router.push({ pathname: '/standards', query: { standard_set: 'teks' } })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              standard_set === 'teks' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Texas (TEKS)
          </button>
        </div>
      </div>
      
      <StandardsExplorer standardSet={standard_set as string} />
    </Layout>
  )
} 