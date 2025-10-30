import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthGuard from '@/lib/authGuard';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import UsersPage from '@/features/users/UsersPage';
import ProductsPage from '@/features/products/ProductsPage';
import OrdersPage from '@/features/orders/OrdersPage';
import PaymentsPage from '@/features/payments/PaymentsPage';
import ContentPagesPage from '@/features/content/ContentPagesPage';
import BannersPage from '@/features/content/BannersPage';
import MediaPage from '@/features/content/MediaPage';
import CategoriesPage from '@/features/catalog/CategoriesPage';
import BrandsPage from '@/features/catalog/BrandsPage';
import AttributesPage from '@/features/catalog/AttributesPage';
import RolesPage from '@/features/system/RolesPage';
import AuditLogsPage from '@/features/system/AuditLogsPage';
import SettingsPage from '@/features/system/SettingsPage';
import SubCategoriesPage from '@/features/catalog/SubCategoriesPage';
import LandingPage from '@/features/landing/landingPage';

const NotFoundPage = () => (
  <div className='p-6 text-center'>404 - Page Not Found</div>
);
const UnauthorizedPage = () => (
  <div className='p-6 text-center'>401 - Unauthorized Access</div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to='/dashboard'
            replace
          />
        ),
      },
      {
        path: 'dashboard',
        element: (
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <AuthGuard>
            <UsersPage />
          </AuthGuard>
        ),
      },
      {
        path: 'products',
        element: (
          <AuthGuard>
            <ProductsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'orders',
        element: (
          <AuthGuard>
            <OrdersPage />
          </AuthGuard>
        ),
      },
      {
        path: 'payments',
        element: (
          <AuthGuard>
            <PaymentsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'content',
        children: [
          {
            path: 'pages',
            element: (
              <AuthGuard>
                <ContentPagesPage />
              </AuthGuard>
            ),
          },
          {
            path: 'banners',
            element: (
              <AuthGuard>
                <BannersPage />
              </AuthGuard>
            ),
          },
          {
            path: 'media',
            element: (
              <AuthGuard>
                <MediaPage />
              </AuthGuard>
            ),
          },
        ],
      },
      {
        path: 'catalog',
        children: [
          {
            path: 'categories',
            element: (
              <AuthGuard>
                <CategoriesPage />
              </AuthGuard>
            ),
          },
          {
            path: 'subcategories',
            element: (
              <AuthGuard>
                <SubCategoriesPage />
              </AuthGuard>
            ),
          },
          {
            path: 'brands',
            element: (
              <AuthGuard>
                <BrandsPage />
              </AuthGuard>
            ),
          },
          {
            path: 'attributes',
            element: (
              <AuthGuard>
                <AttributesPage />
              </AuthGuard>
            ),
          },
        ],
      },
      {
        path: 'system',
        children: [
          {
            path: 'roles',
            element: (
              <AuthGuard>
                <RolesPage />
              </AuthGuard>
            ),
          },
          {
            path: 'audit-logs',
            element: (
              <AuthGuard>
                <AuditLogsPage />
              </AuthGuard>
            ),
          },
          {
            path: 'settings',
            element: (
              <AuthGuard>
                <SettingsPage />
              </AuthGuard>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
