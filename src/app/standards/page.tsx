'use client';

import { useSearchParams } from 'next/navigation';
import StandardsExplorer from '../../components/StandardsExplorer';

export default function StandardsPage() {
  const searchParams = useSearchParams();
  const subject = searchParams?.get('subject') || 'math';

  return (
    <div className="w-full">
      <StandardsExplorer key={subject} subject={subject} />
    </div>
  );
} 