import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles: string[]; // Roles that can see this item
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
}) => {
  const { data: session } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const userRoleKey = session?.user?.roles?.[0]?.key || '';
  const userRoles = session?.user?.roles?.map((r: any) => r.key) || [];

  // Check if user has access to a nav item
  const canAccess = (itemRoles: string[]): boolean => {
    if (itemRoles.length === 0) return true;
    return itemRoles.some((role) => userRoles.includes(role));
  };

  // Navigation items configuration
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: [], // All authenticated users
    },
    {
      label: 'Bookings',
      href: '/admin/bookings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'STAFF_FRONTDESK', 'STAFF_OPS'],
    },
    {
      label: 'Loyalty',
      href: '/admin/loyalty',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      label: 'Communication Hub',
      href: '/admin/communication-hub',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'STAFF_FRONTDESK', 'STAFF_OPS'],
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      label: 'Integrations',
      href: '/admin/integrations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
      label: 'Settings / Users',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      roles: ['SUPERADMIN', 'ADMIN'],
    },
  ];

  // Filter nav items based on user role
  const accessibleItems = navItems.filter((item) => canAccess(item.roles));

  // Check if a nav item is active
  const isActive = (href: string): boolean => {
    if (href === '/admin') {
      return currentPath === '/admin' || currentPath === '/admin/';
    }
    return currentPath.startsWith(href);
  };

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        ref={sidebarRef}
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-neutral-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
          pt-16 md:pt-0
        `}
        aria-label="Main navigation"
      >
        {/* Sidebar Header (Desktop only) */}
        <div className="hidden md:flex items-center h-16 px-6 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Navigation
          </h2>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {accessibleItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-button
                      text-sm font-medium transition-colors
                      ${
                        active
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }
                    `}
                    onClick={() => {
                      // Close sidebar on mobile after clicking
                      if (window.innerWidth < 768) {
                        onClose();
                      }
                    }}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default AdminSidebar;

