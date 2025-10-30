import React from 'react';
import { Shield, Users, Check, X } from 'lucide-react';
import { Permission, getPermissions } from '@/lib/rbac';
import { Role } from '@/types/user';

interface RoleInfo {
  role: Role;
  description: string;
  userCount: number;
  color: string;
}

const roleInfo: RoleInfo[] = [
  {
    role: 'SuperAdmin',
    description: 'Full system access with all permissions',
    userCount: 1,
    color: 'bg-red-100 text-red-800'
  },
  {
    role: 'Admin',
    description: 'Administrative access to most features',
    userCount: 2,
    color: 'bg-purple-100 text-purple-800'
  },
  {
    role: 'Manager',
    description: 'Management access to products and orders',
    userCount: 3,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    role: 'Support',
    description: 'Customer support and order management',
    userCount: 5,
    color: 'bg-green-100 text-green-800'
  },
  {
    role: 'ContentEditor',
    description: 'Content and product catalog management',
    userCount: 2,
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    role: 'Finance',
    description: 'Financial data and payment management',
    userCount: 1,
    color: 'bg-indigo-100 text-indigo-800'
  }
];

const allPermissions: Permission[] = [
  'users:list', 'users:create', 'users:update', 'users:delete', 'users:import', 'users:export',
  'products:list', 'products:create', 'products:update', 'products:delete', 'products:import', 'products:bulkUpdate',
  'orders:list', 'orders:update', 'orders:export',
  'payments:list', 'payments:refund',
  'content:list', 'content:create', 'content:update', 'content:delete',
  'catalog:list', 'catalog:create', 'catalog:update', 'catalog:delete',
  'system:roles', 'system:audit', 'system:settings',
  'dashboard:view'
];

const permissionGroups = {
  'Users': ['users:list', 'users:create', 'users:update', 'users:delete', 'users:import', 'users:export'],
  'Products': ['products:list', 'products:create', 'products:update', 'products:delete', 'products:import', 'products:bulkUpdate'],
  'Orders': ['orders:list', 'orders:update', 'orders:export'],
  'Payments': ['payments:list', 'payments:refund'],
  'Content': ['content:list', 'content:create', 'content:update', 'content:delete'],
  'Catalog': ['catalog:list', 'catalog:create', 'catalog:update', 'catalog:delete'],
  'System': ['system:roles', 'system:audit', 'system:settings'],
  'Dashboard': ['dashboard:view']
};

const RolesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="text-gray-600">Manage user roles and their permissions</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roleInfo.map((info) => (
          <div key={info.role} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                        {info.role}
                      </span>
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 mt-1">{info.description}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{info.userCount} users</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Permission Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  {roleInfo.map((info) => (
                    <th key={info.role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {info.role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(permissionGroups).map(([group, permissions]) => (
                  <React.Fragment key={group}>
                    <tr className="bg-gray-50">
                      <td colSpan={roleInfo.length + 1} className="px-6 py-2 text-sm font-medium text-gray-900">
                        {group}
                      </td>
                    </tr>
                    {permissions.map((permission) => (
                      <tr key={permission}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {permission.split(':')[1]}
                        </td>
                        {roleInfo.map((info) => {
                          const hasPermission = getPermissions(info.role).includes(permission);
                          return (
                            <td key={info.role} className="px-6 py-4 whitespace-nowrap text-center">
                              {hasPermission ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-500 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesPage;