import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlayCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  url?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
};

const isLikelyUrl = (u?: string) => !!u && /^https?:\/\/.+/i.test(u);

const VideoPreviewButton: React.FC<Props> = ({
  url,
  disabled,
  className,
  label = 'Preview Video',
}) => {
  const [open, setOpen] = React.useState(false);
  const canPreview = isLikelyUrl(url) && !disabled;

  return (
    <>
      {/* Trigger button */}
      <button
        type='button'
        className={cn(
          'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-150',
          canPreview
            ? 'bg-primary-500 text-white border-transparent hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 active:scale-[0.98]'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed',
          className
        )}
        onClick={() => canPreview && setOpen(true)}
        disabled={!canPreview}
        title={
          canPreview ? 'Preview video in full screen' : 'Invalid video URL'
        }
      >
        <PlayCircle className='h-4 w-4' />
        {label}
      </button>

      {/* Modal / Dialog */}
      <Transition
        appear
        show={open}
        as={React.Fragment}
      >
        <Dialog
          as='div'
          className='relative z-50'
          onClose={() => setOpen(false)}
        >
          {/* Backdrop */}
          <Transition.Child
            as={React.Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black/80 backdrop-blur-sm' />
          </Transition.Child>

          <div className='fixed inset-0 flex items-center justify-center p-4 sm:p-6'>
            <Transition.Child
              as={React.Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel
                className={cn(
                  'relative w-full max-w-6xl h-[85vh] rounded-lg overflow-hidden shadow-2xl bg-black'
                )}
              >
                {/* Close button */}
                <button
                  className='absolute top-4 right-4 text-white/90 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1'
                  onClick={() => setOpen(false)}
                  aria-label='Close preview'
                >
                  <X className='h-6 w-6' />
                </button>

                {/* Video content */}
                <video
                  src={url}
                  className='h-full w-full object-contain'
                  controls
                  autoPlay
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default VideoPreviewButton;
