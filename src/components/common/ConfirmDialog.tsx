import React from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-primary-500',
          button: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500',
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
        };
      case 'success':
        return {
          icon: 'text-green-500',
          button: 'bg-green-500 hover:bg-green-600 focus:ring-green-500',
        };
      default:
        return {
          icon: 'text-gray-500',
          button: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500',
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className={`h-6 w-6 ${getStyles().icon}`} />;
      case 'info':
        return <Info className={`h-6 w-6 ${getStyles().icon}`} />;
      case 'success':
        return <CheckCircle2 className={`h-6 w-6 ${getStyles().icon}`} />;
      default:
        return <AlertCircle className={`h-6 w-6 ${getStyles().icon}`} />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size='sm'
    >
      <div className='space-y-5'>
        {/* Icon + message */}
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0'>{getIcon()}</div>
          <p className='text-sm text-gray-700 leading-relaxed'>{message}</p>
        </div>

        {/* Buttons */}
        <div className='flex justify-end space-x-3 pt-2'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300'
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
              getStyles().button
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
