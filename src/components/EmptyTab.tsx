import { Construction } from 'lucide-react';

interface EmptyTabProps {
  title: string;
  description?: string;
}

export function EmptyTab({ title, description }: EmptyTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
          <Construction className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          {description || 'This section is currently under development. Check back soon for updates.'}
        </p>
      </div>
    </div>
  );
}
