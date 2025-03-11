import { useRouter } from 'next/navigation';

type SubjectSelectorProps = {
  currentSubject: string;
  standardSets?: boolean;
  onSubjectChange?: (subject: string) => void;
  className?: string;
};

export default function SubjectSelector({ 
  currentSubject, 
  standardSets = false,
  onSubjectChange,
  className = ''
}: SubjectSelectorProps) {
  const router = useRouter();

  const handleSubjectChange = (subject: string) => {
    if (onSubjectChange) {
      onSubjectChange(subject);
    } else {
      router.push(`${standardSets ? '/standards' : '/content'}?subject=${subject}`);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={() => handleSubjectChange('math')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          currentSubject === 'math'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
        }`}
      >
        Math
      </button>
      <button
        onClick={() => handleSubjectChange('science')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          currentSubject === 'science'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
        }`}
      >
        Science
      </button>
    </div>
  );
} 