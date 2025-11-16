import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminBreadcrumbs from './AdminBreadcrumbs';
import { useRouter } from 'next/router';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const AdminShell: React.FC<AdminShellProps> = ({
  children,
  title = 'Admin | POD N BEYOND',
  breadcrumbs,
}) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Close sidebar on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="POD N BEYOND Admin Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Admin Header */}
        <AdminHeader onToggleSidebar={toggleSidebar} />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <AdminSidebar
            isOpen={sidebarOpen}
            onClose={closeSidebar}
            currentPath={router.asPath}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4">
                <AdminBreadcrumbs items={breadcrumbs} />
              </div>
            )}

            {/* Page Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminShell;

