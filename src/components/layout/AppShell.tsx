import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const SIDEBAR_OFFSET = 'lg:ml-64'; // match Sidebar width (16rem)

const AppShell: React.FC = () => {
  return (
    <div className='h-screen w-full bg-gray-50 text-gray-900 dark:bg-darkSurface-base dark:text-gray-100 transition-colors duration-300'>
      {/* Sidebar (fixed) */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`flex flex-col h-screen ${SIDEBAR_OFFSET} bg-white dark:bg-darkSurface-elevated border-l border-gray-200 dark:border-darkSurface-border transition-all duration-300`}
      >
        {/* Top navigation bar */}
        <Topbar />

        {/* Scrollable main content */}
        <main className='flex-1 overflow-y-auto relative focus:outline-none'>
          <div
            className='
              py-6 px-4 sm:px-6 md:px-8
              bg-gray-50 dark:bg-darkSurface-base
              min-h-[calc(100vh-64px)]
              transition-colors duration-300
            '
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Optional subtle background gradient for depth */}
      <div className='pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-white/[0.03]' />
    </div>
  );
};

export default AppShell;
