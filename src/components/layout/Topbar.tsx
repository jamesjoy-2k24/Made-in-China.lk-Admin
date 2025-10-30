import React, { useState, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { RootState } from '@/app/types';
import { logout } from '@/features/auth/slice';
import { useLogoutMutation } from '@/features/auth/api';
import { cn, getInitials } from '@/lib/utils';

const ModernTopbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [logoutMutation] = useLogoutMutation();
  const [searchFocused, setSearchFocused] = useState(false);
  const [hasNotifications] = useState(true);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div
      className='
        sticky top-0 z-40
        flex items-center justify-between
        px-6 py-3
        bg-white/80 dark:bg-darkSurface-header/80
        backdrop-blur-md
        border-b border-gray-200 dark:border-darkSurface-border
        transition-colors duration-300
      '
    >
      {/* Search */}
      <div className='flex-1 flex justify-center'>
        <div
          className={cn(
            'relative w-full max-w-md transition-all duration-200',
            searchFocused && 'ring-2 ring-primary-500 ring-offset-1'
          )}
        >
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500' />
          <input
            id='search-field'
            placeholder='Search products, orders, users...'
            type='search'
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className='
              w-full pl-9 pr-12 py-2 text-sm rounded-md
              border border-gray-300 dark:border-darkSurface-border
              bg-gray-50 dark:bg-darkSurface-base
              placeholder-gray-400 dark:placeholder-gray-500
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-primary-500
              transition
            '
          />
          <div
            className='
              absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500
              bg-gray-100 dark:bg-darkSurface-elevated rounded px-1.5 py-0.5
            '
          >
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-4 ml-4'>
        {/* Notifications */}
        <button
          className='
            relative inline-flex items-center justify-center
            w-9 h-9 rounded-full
            bg-gray-100 dark:bg-darkSurface-elevated
            text-gray-700 dark:text-gray-300
            hover:text-primary-500 hover:bg-gray-200 dark:hover:bg-darkSurface-hover
            focus:outline-none focus:ring-2 focus:ring-primary-500 transition
          '
        >
          <Bell className='h-5 w-5' />
          {hasNotifications && (
            <span className='absolute top-2 right-2 h-2.5 w-2.5 bg-primary-500 rounded-full ring-2 ring-white dark:ring-darkSurface-elevated' />
          )}
        </button>

        {/* Profile dropdown */}
        <Menu
          as='div'
          className='relative'
        >
          <Menu.Button
            className='
              flex items-center gap-3 px-3 py-1.5 rounded-md
              bg-gray-100 dark:bg-darkSurface-elevated
              hover:bg-gray-200 dark:hover:bg-darkSurface-hover
              transition
              focus:outline-none focus:ring-2 focus:ring-primary-500
            '
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className='h-8 w-8 rounded-full object-cover border border-gray-300 dark:border-darkSurface-border'
              />
            ) : (
              <div className='h-8 w-8 rounded-full flex items-center justify-center bg-primary-500 text-white text-sm font-medium'>
                {getInitials(user?.name || 'U')}
              </div>
            )}
            <div className='hidden sm:flex flex-col items-start'>
              <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                {user?.name}
              </span>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                {user?.role}
              </span>
            </div>
            <ChevronDown className='h-4 w-4 text-gray-500 dark:text-gray-400' />
          </Menu.Button>

          {/* Dropdown */}
          <Transition
            as={Fragment}
            enter='transition ease-out duration-100'
            enterFrom='transform opacity-0 scale-95'
            enterTo='transform opacity-100 scale-100'
            leave='transition ease-in duration-75'
            leaveFrom='transform opacity-100 scale-100'
            leaveTo='transform opacity-0 scale-95'
          >
            <Menu.Items
              className='
                absolute right-0 mt-2 w-64 origin-top-right rounded-md
                bg-white dark:bg-darkSurface-elevated
                border border-gray-200 dark:border-darkSurface-border
                shadow-lg ring-1 ring-black/5 focus:outline-none
              '
            >
              <div className='px-4 py-3 border-b border-gray-100 dark:border-darkSurface-border'>
                <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {user?.name}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {user?.role}
                </p>
              </div>

              <div className='py-1'>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                        active
                          ? 'bg-gray-100 dark:bg-darkSurface-hover text-primary-600'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <User className='h-4 w-4' />
                      My Profile
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                        active
                          ? 'bg-gray-100 dark:bg-darkSurface-hover text-primary-600'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <Settings className='h-4 w-4' />
                      Settings
                    </button>
                  )}
                </Menu.Item>

                <div className='border-t border-gray-100 dark:border-darkSurface-border my-1' />

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-500 transition-colors',
                        active && 'bg-gray-100 dark:bg-darkSurface-hover'
                      )}
                    >
                      <LogOut className='h-4 w-4' />
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

export default ModernTopbar;
