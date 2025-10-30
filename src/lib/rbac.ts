import { Role } from '@/types/user';

export type Permission = 
  | 'users:list' | 'users:create' | 'users:update' | 'users:delete' | 'users:import' | 'users:export'
  | 'products:list' | 'products:create' | 'products:update' | 'products:delete' | 'products:import' | 'products:bulkUpdate'
  | 'orders:list' | 'orders:update' | 'orders:export'
  | 'payments:list' | 'payments:refund'
  | 'content:list' | 'content:create' | 'content:update' | 'content:delete'
  | 'catalog:list' | 'catalog:create' | 'catalog:update' | 'catalog:delete'
  | 'system:roles' | 'system:audit' | 'system:settings'
  | 'dashboard:view';

const rolePermissions: Record<Role, Permission[]> = {
  SuperAdmin: [
    'users:list', 'users:create', 'users:update', 'users:delete', 'users:import', 'users:export',
    'products:list', 'products:create', 'products:update', 'products:delete', 'products:import', 'products:bulkUpdate',
    'orders:list', 'orders:update', 'orders:export',
    'payments:list', 'payments:refund',
    'content:list', 'content:create', 'content:update', 'content:delete',
    'catalog:list', 'catalog:create', 'catalog:update', 'catalog:delete',
    'system:roles', 'system:audit', 'system:settings',
    'dashboard:view'
  ],
  Admin: [
    'users:list', 'users:create', 'users:update', 'users:export',
    'products:list', 'products:create', 'products:update', 'products:delete', 'products:import', 'products:bulkUpdate',
    'orders:list', 'orders:update', 'orders:export',
    'payments:list',
    'content:list', 'content:create', 'content:update', 'content:delete',
    'catalog:list', 'catalog:create', 'catalog:update', 'catalog:delete',
    'system:audit', 'system:settings',
    'dashboard:view'
  ],
  Manager: [
    'users:list', 'users:export',
    'products:list', 'products:create', 'products:update', 'products:import', 'products:bulkUpdate',
    'orders:list', 'orders:update', 'orders:export',
    'payments:list',
    'content:list', 'content:create', 'content:update',
    'catalog:list', 'catalog:create', 'catalog:update',
    'dashboard:view'
  ],
  Support: [
    'users:list',
    'products:list',
    'orders:list', 'orders:update', 'orders:export',
    'payments:list',
    'dashboard:view'
  ],
  ContentEditor: [
    'products:list',
    'content:list', 'content:create', 'content:update', 'content:delete',
    'catalog:list',
    'dashboard:view'
  ],
  Finance: [
    'orders:list', 'orders:export',
    'payments:list', 'payments:refund',
    'dashboard:view'
  ]
};

export const can = (role: Role | null, permission: Permission): boolean => {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
};

export const hasAnyPermission = (role: Role | null, permissions: Permission[]): boolean => {
  if (!role) return false;
  return permissions.some(permission => can(role, permission));
};

export const getPermissions = (role: Role | null): Permission[] => {
  if (!role) return [];
  return rolePermissions[role] ?? [];
};