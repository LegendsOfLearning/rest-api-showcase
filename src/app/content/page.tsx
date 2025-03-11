'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ContentExplorer from '../../components/ContentExplorer';

export default function ContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = searchParams?.get('subject') || 'math';
  const standardSet = searchParams?.get('standard_set');
  
  // Set default subject to math if not specified
  useEffect(() => {
    if (!searchParams?.get('subject')) {
      router.push('/content?subject=math');
    }
  }, [router, searchParams]);
  
  return (
    <div className="w-full">
      <ContentExplorer 
        key={subject} 
        subject={subject} 
        standardSet={standardSet} 
      />
    </div>
  );
} 