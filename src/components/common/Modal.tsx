import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      setShow(true);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      setShow(false);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8',
        'overflow-y-auto'
      )}
      role='dialog'
      aria-modal='true'
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          show ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Modal container */}
      <div
        className={cn(
          'relative w-full rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-2xl',
          'transform transition-all duration-300',
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight'>
            {title}
          </h3>
          <button
            onClick={onClose}
            className='rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition'
            aria-label='Close modal'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Content */}
        <div className='px-6 py-5 text-gray-700 dark:text-gray-200'>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
