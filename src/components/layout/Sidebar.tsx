import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  Image,
  Folder,
  Tag,
  Award,
  Settings,
  Shield,
  Activity,
  Cog,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  {
    name: 'Content',
    icon: FileText,
    children: [
      { name: 'Pages', href: '/content/pages', icon: FileText },
      { name: 'Banners', href: '/content/banners', icon: Image },
      { name: 'Media Library', href: '/content/media', icon: Folder },
    ],
  },
  {
    name: 'Catalog Setup',
    icon: Tag,
    children: [
      { name: 'Categories', href: '/catalog/categories', icon: Folder },
      { name: 'SubCategories', href: '/catalog/subcategories', icon: Folder },
      { name: 'Brands', href: '/catalog/brands', icon: Award },
      { name: 'Attributes', href: '/catalog/attributes', icon: Tag },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    children: [
      { name: 'Roles & Permissions', href: '/system/roles', icon: Shield },
      { name: 'Audit Logs', href: '/system/audit-logs', icon: Activity },
      { name: 'Settings', href: '/system/settings', icon: Cog },
    ],
  },
];

export default function ModernSidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const isParentActive = (children: any[]) =>
    children.some((child) => isActive(child.href));

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', !isCollapsed);
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className='fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-md bg-primary-500 text-white shadow-lg lg:hidden'
      >
        {isCollapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Overlay (mobile only) */}
      {!isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          className='fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden'
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed z-40 inset-y-0 left-0 w-64 lg:translate-x-0 transform transition-all duration-300',
          isCollapsed ? '-translate-x-full' : 'translate-x-0',
          'bg-white dark:bg-darkSurface-elevated border-r border-gray-200 dark:border-darkSurface-border shadow-xl'
        )}
      >
        {/* Logo */}
        <div className='flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-darkSurface-border'>
          <div className='flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-primary-500 to-primary-700 text-white shadow-sm'>
            <Package size={20} />
          </div>
          <span className='font-semibold text-lg text-gray-900 dark:text-gray-100'>
            Made-in-China
          </span>
        </div>

        {/* Navigation */}
        <nav className='flex-1 overflow-y-auto px-3 py-4 space-y-1'>
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expandedItems.includes(item.name);
              const hasActiveChild = isParentActive(item.children);

              return (
                <div
                  key={item.name}
                  className='space-y-1'
                >
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200',
                      hasActiveChild
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkSurface-hover'
                    )}
                  >
                    <div className='flex items-center gap-3'>
                      <item.icon className='h-5 w-5 opacity-80' />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transform transition-transform duration-200',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'ml-4 mt-1 space-y-0.5 overflow-hidden border-l border-gray-200 dark:border-darkSurface-border transition-all',
                      isExpanded ? 'max-h-96' : 'max-h-0'
                    )}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          'flex items-center gap-2 pl-4 pr-3 py-2 text-sm rounded-md transition-all duration-200',
                          isActive(child.href)
                            ? 'bg-primary-50 dark:bg-primary-900/25 text-primary-600 dark:text-primary-400 border-l-2 border-primary-500'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkSurface-hover'
                        )}
                      >
                        <child.icon className='h-4 w-4' />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-2 border-primary-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkSurface-hover'
                )}
              >
                <item.icon className='h-5 w-5 opacity-80' />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className='px-4 py-3 border-t border-gray-200 dark:border-darkSurface-border text-xs text-gray-500 dark:text-gray-500'>
          <p>© 2025 kala.nex - Made-in-China.lk</p>
        </div>
      </aside>
    </>
  );
}
