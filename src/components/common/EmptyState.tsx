import React from 'react';
import { Package2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'info' | 'error' | 'success';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Package2,
  variant = 'default',
  action,
  className,
}) => {
  const variantColors = {
    default: 'text-gray-400',
    info: 'text-blue-500 dark:text-blue-400',
    error: 'text-primary-500 dark:text-primary-400',
    success: 'text-green-500 dark:text-green-400',
  }[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        'bg-white dark:bg-darkSurface-base rounded-lg border border-gray-200 dark:border-darkSurface-stroke shadow-sm',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 dark:bg-darkSurface-elevated mb-4',
          variantColors
        )}
      >
        <Icon className={cn('h-8 w-8', variantColors)} />
      </div>

      {/* Title */}
      <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className='mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md'>
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <div className='mt-6'>
          <button
            type='button'
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm',
              'text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all'
            )}
          >
            <Plus className='-ml-1 mr-2 h-5 w-5' />
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
