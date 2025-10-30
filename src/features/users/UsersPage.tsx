import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  Eye,
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { useSelector } from 'react-redux';
import { User } from '@/types/user';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from './api';
import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import UserModal from './UserModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { RootState } from '@/app/types';
import { can } from '@/lib/rbac';
import { getInitials } from '@/lib/utils';

const UsersPage: React.FC = () => {
  const { role } = useSelector((state: RootState) => state.auth);

  // RTK Query hooks
  const { data: users = [], isLoading } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // Modals & Dialogs
  const [userModal, setUserModal] = React.useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    user: User | null;
  }>({ isOpen: false, mode: 'create', user: null });

  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Helpers
  const openUserModal = (
    mode: 'create' | 'edit' | 'view',
    user: User | null = null
  ) => setUserModal({ isOpen: true, mode, user });

  const closeUserModal = () =>
    setUserModal({ isOpen: false, mode: 'create', user: null });

  const handleSaveUser = async (userData: any) => {
    try {
      if (userModal.mode === 'create') {
        await createUser({
          ...userData,
          isVerified: userData.isVerified || false,
        }).unwrap();
      } else if (userModal.mode === 'edit' && userModal.user) {
        await updateUser({ id: userModal.user.id, data: userData }).unwrap();
      }
      closeUserModal();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleDeleteUser = (user: User) =>
    setDeleteDialog({ isOpen: true, user });

  const confirmDeleteUser = async () => {
    try {
      if (deleteDialog.user) {
        await deleteUser(deleteDialog.user.id).unwrap();
        setDeleteDialog({ isOpen: false, user: null });
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Filters
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && user.isVerified) ||
        (statusFilter === 'unverified' && !user.isVerified);
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  // Columns
  const columns: ColumnDef<User>[] = React.useMemo(
    () => [
      {
        id: 'user',
        header: 'User',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className='flex items-center'>
              {user.profileImageUrl ? (
                <img
                  className='h-10 w-10 rounded-full object-cover border dark:border-darkSurface-stroke'
                  src={user.profileImageUrl}
                  alt={user.name}
                />
              ) : (
                <div className='h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium'>
                  {getInitials(user.name)}
                </div>
              )}
              <div className='ml-4'>
                <div className='flex items-center'>
                  <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {user.name}
                  </span>
                  {user.isVerified ? (
                    <UserCheck className='ml-2 h-4 w-4 text-green-500' />
                  ) : (
                    <span className='ml-2 text-xs text-gray-400'>
                      Unverified
                    </span>
                  )}
                </div>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {user.phone}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'isVerified',
        header: 'Verification',
        cell: ({ getValue }) => {
          const isVerified = getValue() as boolean;
          return (
            <StatusBadge
              status={isVerified ? 'Verified' : 'Unverified'}
              variant={isVerified ? 'success' : 'warning'}
            />
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Menu
              as='div'
              className='relative inline-block text-left'
            >
              <Menu.Button className='flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'>
                <MoreHorizontal className='h-5 w-5' />
              </Menu.Button>
              <Menu.Items className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md border border-gray-200 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-elevated shadow-xl ring-1 ring-black/5 focus:outline-none'>
                <Menu.Item>
                  <button
                    onClick={() => openUserModal('view', user)}
                    className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                  >
                    <Eye className='mr-3 h-4 w-4' />
                    View Details
                  </button>
                </Menu.Item>
                {can(role, 'users:update') && (
                  <Menu.Item>
                    <button
                      onClick={() => openUserModal('edit', user)}
                      className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                    >
                      <Edit className='mr-3 h-4 w-4' />
                      Edit User
                    </button>
                  </Menu.Item>
                )}
                <Menu.Item>
                  <button className='flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'>
                    <Shield className='mr-3 h-4 w-4' />
                    Reset Password
                  </button>
                </Menu.Item>
                {can(role, 'users:delete') && (
                  <Menu.Item>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className='flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                    >
                      <Trash2 className='mr-3 h-4 w-4' />
                      Delete User
                    </button>
                  </Menu.Item>
                )}
              </Menu.Items>
            </Menu>
          );
        },
      },
    ],
    [role]
  );

  if (!can(role, 'users:list')) {
    return (
      <div className='text-center py-12 text-gray-500 dark:text-gray-400'>
        You don’t have permission to view users.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Users
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Manage user accounts and permissions
          </p>
        </div>
        {can(role, 'users:create') && (
          <button
            onClick={() => openUserModal('create')}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-darkSurface-elevated p-4 rounded-lg border border-gray-200 dark:border-darkSurface-stroke shadow-sm sm:flex sm:items-center sm:space-x-4'>
        <div className='flex-1 mb-3 sm:mb-0'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search users...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-darkSurface-stroke rounded-md leading-5 bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm'
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-elevated text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500'
        >
          <option value='all'>All Users</option>
          <option value='verified'>Verified</option>
          <option value='unverified'>Unverified</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className='text-gray-500 dark:text-gray-400'>Loading users…</div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title='No users found'
          description='Get started by creating a new user account.'
          action={
            can(role, 'users:create')
              ? { label: 'Add User', onClick: () => openUserModal('create') }
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          enableExport={can(role, 'users:export')}
          exportFilename='users'
        />
      )}

      {/* User Modal */}
      <UserModal
        isOpen={userModal.isOpen}
        onClose={closeUserModal}
        onSave={handleSaveUser}
        user={userModal.user}
        mode={userModal.mode}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={confirmDeleteUser}
        title='Delete User'
        message={`Are you sure you want to delete "${deleteDialog.user?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        type='danger'
      />
    </div>
  );
};

export default UsersPage;
