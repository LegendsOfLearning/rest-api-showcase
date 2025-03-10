import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AssignmentCreator from '../components/AssignmentCreator'
import StandardsExplorer from '../components/StandardsExplorer'
import GameExplorer from '../components/GameExplorer'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/games')
  }, [router])
  
  return null
} 