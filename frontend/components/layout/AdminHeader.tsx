import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  environmentLabel?: string; // e.g., "Staging", "Production"
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  environmentLabel,
}) => {
  const { data: session, signOut } = useAuth();
  const userRoleKey = session?.user?.roles?.[0]?.key || '';
  const userRoleLabel = userRoleKey.replace(/_/g, ' ') || 'Member';
  const userName = session?.user?.email || 'Not signed in';
  const userDisplayName = session?.user?.name || userName;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900 text-white shadow-minimal border-b border-neutral-800">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Logo/Brand + Mobile Menu Button */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger Button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-button hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500"
            aria-label="Toggle sidebar"
            aria-expanded={false}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Brand/Logo */}
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src="/logos/podnbeyond-group.svg"
              alt="POD N BEYOND"
              className="h-8 w-auto"
            />
            <span className="hidden sm:block text-lg font-semibold">Admin</span>
          </Link>

          {/* Environment Badge */}
          {environmentLabel && (
            <Badge variant="warning" size="sm">
              {environmentLabel}
            </Badge>
          )}
        </div>

        {/* Right: User Info + Sign Out */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="hidden sm:flex sm:flex-col sm:items-end">
            <span className="text-sm font-medium">{userDisplayName}</span>
            <span className="text-xs text-neutral-400 uppercase tracking-wide">
              {userRoleLabel}
            </span>
          </div>

          {/* Sign Out Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-white hover:bg-neutral-800 border-neutral-700"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

