import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Circle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  active?: boolean;
  onClick?: () => void;
  withIcon?: boolean;
  className?: string;
}

const variantConfig = {
  primary: {
    icon: <XCircle className='h-3.5 w-3.5 text-primary-600 mr-1' />,
    base: 'bg-primary-50 text-primary-800 border border-primary-200',
    active: 'bg-primary-600 text-white border-transparent shadow-sm',
    focus: 'focus:ring-primary-500',
  },
  success: {
    icon: <CheckCircle2 className='h-3.5 w-3.5 text-success-600 mr-1' />,
    base: 'bg-success-50 text-success-800 border border-success-200',
    active: 'bg-success-600 text-white border-transparent shadow-sm',
    focus: 'focus:ring-success-500',
  },
  warning: {
    icon: <AlertTriangle className='h-3.5 w-3.5 text-warning-600 mr-1' />,
    base: 'bg-warning-50 text-warning-800 border border-warning-200',
    active: 'bg-warning-600 text-white border-transparent shadow-sm',
    focus: 'focus:ring-warning-500',
  },
  error: {
    icon: <XCircle className='h-3.5 w-3.5 text-primary-600 mr-1' />,
    base: 'bg-primary-50 text-primary-800 border border-primary-200',
    active: 'bg-primary-600 text-white border-transparent shadow-sm',
    focus: 'focus:ring-primary-500',
  },
  info: {
    icon: <Info className='h-3.5 w-3.5 text-info-600 mr-1' />,
    base: 'bg-info-50 text-info-800 border border-info-200',
    active: 'bg-info-600 text-white border-transparent shadow-sm',
    focus: 'focus:ring-info-500',
  },
  default: {
    icon: <Circle className='h-3.5 w-3.5 text-gray-400 mr-1' />,
    base: 'bg-gray-100 text-gray-800 border border-gray-200',
    active: 'bg-gray-700 text-white border-transparent shadow-sm',
    focus: 'focus:ring-gray-400',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  active = false,
  onClick,
  withIcon = true,
  className,
}) => {
  const cfg = variantConfig[variant];
  const common =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide select-none transition-colors duration-150';

  const baseClasses = cn(
    common,
    active ? cfg.active : cfg.base,
    className,
    onClick &&
      `cursor-pointer hover:opacity-90 ${cfg.focus} focus:outline-none focus:ring-2 focus:ring-offset-2`
  );

  if (onClick) {
    return (
      <button
        type='button'
        onClick={onClick}
        className={baseClasses}
      >
        {withIcon && cfg.icon}
        {status}
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      {withIcon && cfg.icon}
      {status}
    </span>
  );
};

export default StatusBadge;
