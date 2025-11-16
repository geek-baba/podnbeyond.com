/**
 * Loyalty Program Admin Page
 * Displays a list of loyalty members with filters, pagination, and actions
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import Head from 'next/head';
import Header from '../../../components/layout/Header';
import Container from '../../../components/layout/Container';
import Link from 'next/link';
import Badge from '../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Card from '../../../components/ui/Card';
import TableContainer from '../../../components/ui/TableContainer';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { mapLoyaltyTierToBadgeVariant } from '../../../lib/badge-mappers';

interface LoyaltyAccount {
  id: number;
  userId: number;
  memberNumber?: string;
  tier: 'MEMBER' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  points: number;
  lifetimeStays: number;
  lifetimeNights: number;
  lifetimeSpend: number;
  qualificationYearStart?: string;
  qualificationYearEnd?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface LoyaltyAccountsResponse {
  success: boolean;
  accounts?: LoyaltyAccount[];
  data?: LoyaltyAccount[];
  total?: number;
}

export default function LoyaltyPage() {
  const router = useRouter();
  const { data: session, status: authStatus, signOut } = useAuth();
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');

  // Check authentication
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [authStatus, router]);

  // Fetch loyalty accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/loyalty/accounts', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch loyalty accounts');
        }

        const data: LoyaltyAccountsResponse = await response.json();
        const accountsList = data.accounts || data.data || [];
        setAccounts(accountsList);
      } catch (err: any) {
        console.error('Error fetching loyalty accounts:', err);
        setError(err.message || 'Failed to fetch loyalty accounts');
      } finally {
        setLoading(false);
      }
    };

    if (authStatus === 'authenticated') {
      fetchAccounts();
    }
  }, [authStatus]);

  // Filter accounts
  const filteredAccounts = accounts.filter((account) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const email = account.userEmail?.toLowerCase() || account.user?.email?.toLowerCase() || '';
      const name = account.userName?.toLowerCase() || 
        (account.user?.firstName && account.user?.lastName 
          ? `${account.user.firstName} ${account.user.lastName}`.toLowerCase() 
          : '');
      
      if (
        !email.includes(searchLower) &&
        !name.includes(searchLower) &&
        !account.id.toString().includes(searchLower) &&
        !account.memberNumber?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    if (tierFilter && account.tier !== tierFilter) {
      return false;
    }

    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading state
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Loyalty Program | POD N BEYOND Admin</title>
        <meta name="description" content="Manage loyalty program members" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Admin Header */}
      <section className="pt-24 pb-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            {/* Left: User Info and Title */}
            <div className="flex items-start gap-6">
              {/* User Info - Top Left */}
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Signed in as</p>
                  <p className="text-white font-semibold text-sm mt-0.5">
                    {session?.user?.email || 'Not signed in'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(session as any)?.user?.roles?.[0]?.key?.replace(/_/g, ' ') || 'MEMBER'}
                  </p>
                </div>
                <div className="h-12 w-px bg-neutral-700"></div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-button text-sm font-semibold hover:bg-white hover:text-neutral-900 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right: Title */}
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-1">Loyalty Program</h1>
              <p className="text-neutral-300 text-sm">Manage loyalty members and program settings</p>
            </div>
          </div>

          {/* Header Tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/loyalty">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath === '/admin/loyalty'
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                👥 Members
              </button>
            </Link>
            <Link href="/admin/loyalty/points-rules">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/loyalty/points-rules')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                ⭐ Points Rules
              </button>
            </Link>
            <Link href="/admin/loyalty/perks">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/loyalty/perks')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                🎁 Perks
              </button>
            </Link>
            <Link href="/admin/loyalty/campaigns">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/loyalty/campaigns')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                📢 Campaigns
              </button>
            </Link>
            <Link href="/admin/loyalty/redemption-items">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/loyalty/redemption-items')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                🎫 Redemption Catalog
              </button>
            </Link>
            <Link href="/admin">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath === '/admin'
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                ← Admin Dashboard
              </button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-12">
        <Container>
          {/* Filters */}
          <Card variant="default" padding="md" className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Email, name, or member ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Tier Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tier
                </label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="">All Tiers</option>
                  <option value="MEMBER">Member</option>
                  <option value="SILVER">Silver</option>
                  <option value="GOLD">Gold</option>
                  <option value="PLATINUM">Platinum</option>
                  <option value="DIAMOND">Diamond</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <TableContainer>
              <TableSkeleton rows={8} columns={7} />
            </TableContainer>
          )}

          {/* Accounts List */}
          {!loading && !error && (
            <TableContainer
              title="Loyalty Members"
              subtitle={
                filteredAccounts.length > 0
                  ? `${filteredAccounts.length} ${filteredAccounts.length === 1 ? 'member' : 'members'}`
                  : undefined
              }
            >
              {filteredAccounts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Lifetime Stays</TableHead>
                      <TableHead>Lifetime Nights</TableHead>
                      <TableHead>Lifetime Spend</TableHead>
                      <TableHead align="right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell nowrap>
                          <div className="text-sm font-medium">
                            {account.userName || 
                              (account.user?.firstName && account.user?.lastName
                                ? `${account.user.firstName} ${account.user.lastName}`
                                : 'N/A')}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {account.userEmail || account.user?.email || 'No email'}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {account.memberNumber ? `Member: ${account.memberNumber}` : `ID: ${account.id}`}
                          </div>
                        </TableCell>
                        <TableCell nowrap>
                          <Badge variant={mapLoyaltyTierToBadgeVariant(account.tier)} size="sm">
                            {account.tier}
                          </Badge>
                        </TableCell>
                        <TableCell nowrap>
                          <div className="text-sm font-medium">
                            {account.points.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell nowrap>
                          <div className="text-sm">{account.lifetimeStays}</div>
                        </TableCell>
                        <TableCell nowrap>
                          <div className="text-sm">{account.lifetimeNights}</div>
                        </TableCell>
                        <TableCell nowrap>
                          <div className="text-sm">{formatCurrency(account.lifetimeSpend)}</div>
                        </TableCell>
                        <TableCell align="right" nowrap>
                          <button
                            onClick={() => router.push(`/admin?tab=loyalty&edit=${account.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title={
                    search || tierFilter
                      ? 'No members found matching your filters'
                      : 'No loyalty members yet'
                  }
                  description={
                    search || tierFilter
                      ? 'Try adjusting your search or filter criteria'
                      : undefined
                  }
                  variant="table"
                />
              )}
            </TableContainer>
          )}
        </Container>
      </section>
    </div>
  );
}

