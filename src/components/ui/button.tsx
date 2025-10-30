import * as React from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
        'bg-red-600 text-white hover:bg-red-700 px-4 py-2',
        className
      )}
      {...props}
    />
  );
}
