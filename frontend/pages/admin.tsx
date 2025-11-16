import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/useAuth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormField from '../components/ui/FormField';
import { getBookings } from '../lib/booking';

interface AdminDashboardProps {
  brands: any[];
  properties: any[];
  bookings: any[];
  loyalty: any[];
  users: any[];
  roomTypes: any[];
  stats: {
    brands: number;
    properties: number;
    bookings: number;
    loyalty: number;
    users: number;
  };
}

type StaffScopeType = 'PROPERTY' | 'BRAND' | 'ORG';

interface NewUserFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleKey: string;
  scopeType: StaffScopeType;
  scopeId: number | null;
}

export default function AdminDashboard({ brands, properties: initialProperties, bookings, loyalty, users, roomTypes: initialRoomTypes, stats }: AdminDashboardProps) {
  const { data: session, status: authStatus, signOut } = useAuth();
  const router = useRouter();
  const [authTimeout, setAuthTimeout] = useState(false);

  // Add timeout fallback - if auth check takes more than 3 seconds, show page anyway
  useEffect(() => {
    if (authStatus === 'loading') {
      const timeout = setTimeout(() => {
        setAuthTimeout(true);
      }, 3000); // Reduced to 3 seconds to match useAuth timeout
      return () => clearTimeout(timeout);
    } else {
      setAuthTimeout(false);
    }
  }, [authStatus]);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [authStatus, router]);

  const [properties, setProperties] = useState(initialProperties || []);
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes || []);
  const [propertyRoomTypeData, setPropertyRoomTypeData] = useState<Record<number, { property: any; roomTypes: any[] }>>({});
  const [propertyRoomTypesLoaded, setPropertyRoomTypesLoaded] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertyEditorOpen, setPropertyEditorOpen] = useState(false);
  const [propertyEditorLoading, setPropertyEditorLoading] = useState(false);
  const [propertyEditorSaving, setPropertyEditorSaving] = useState(false);
  const [propertyEditorError, setPropertyEditorError] = useState<string | null>(null);
  const [propertyEditorPropertyId, setPropertyEditorPropertyId] = useState<number | null>(null);
  const [propertyForm, setPropertyForm] = useState<any>(null);
  const [roomTypeForms, setRoomTypeForms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState('');
  const [bookingsCount, setBookingsCount] = useState(0); // Client-side bookings count
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [loyaltyCount, setLoyaltyCount] = useState(loyalty?.length || 0); // Client-side loyalty count
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const defaultPropertyId = properties?.[0]?.id || null;
  const defaultBrandId = brands?.[0]?.id || null;
  const defaultScopeType: StaffScopeType = defaultPropertyId ? 'PROPERTY' : defaultBrandId ? 'BRAND' : 'ORG';
  const defaultScopeId = defaultScopeType === 'PROPERTY' ? defaultPropertyId : defaultScopeType === 'BRAND' ? defaultBrandId : null;

  // Fetch bookings count client-side after authentication
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const fetchBookingsCount = async () => {
        try {
          setBookingsLoading(true);
          const response = await getBookings({ page: 1, limit: 1 });
          if (response.success && response.data) {
            setBookingsCount(response.data.total || 0);
          }
        } catch (error) {
          console.error('Error fetching bookings count:', error);
          // Silently fail - bookings count is not critical for dashboard
        } finally {
          setBookingsLoading(false);
        }
      };
      fetchBookingsCount();
    }
  }, [authStatus]);

  // Fetch loyalty accounts count client-side after authentication
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const fetchLoyaltyCount = async () => {
        try {
          setLoyaltyLoading(true);
          const response = await fetch('/api/loyalty/accounts', {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            const accounts = data.accounts || data.data || [];
            setLoyaltyCount(accounts.length);
          }
        } catch (error) {
          console.error('Error fetching loyalty count:', error);
          // Silently fail - loyalty count is not critical for dashboard
        } finally {
          setLoyaltyLoading(false);
        }
      };
      fetchLoyaltyCount();
    }
  }, [authStatus]);
  
  // Payment Gateway Settings
  const [paymentSettings, setPaymentSettings] = useState({
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    isTestMode: true,
    autoCapture: true
  });

  // OTA Channels
  const [otaChannels, setOtaChannels] = useState([
    { id: 1, name: 'Booking.com', enabled: false, connected: false, apiKey: '' },
    { id: 2, name: 'MakeMyTrip', enabled: false, connected: false, apiKey: '' },
    { id: 3, name: 'Airbnb', enabled: false, connected: false, apiKey: '' },
    { id: 4, name: 'Goibibo', enabled: false, connected: false, apiKey: '' },
  ]);

  // User Management - Invite Form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    roleKey: 'STAFF_FRONTDESK',
    scopeType: defaultScopeType,
    scopeId: defaultScopeId
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Loyalty Management
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [bonusStays, setBonusStays] = useState(0);
  const [bonusReason, setBonusReason] = useState('');

  // Users Management
  const [usersList, setUsersList] = useState(users || []);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userRole, setUserRole] = useState('STAFF_FRONTDESK');
  const [userScopeType, setUserScopeType] = useState<StaffScopeType>('ORG');
  const [userScopeId, setUserScopeId] = useState<number | null>(null);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [newUserForm, setNewUserForm] = useState<NewUserFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleKey: 'STAFF_FRONTDESK',
    scopeType: defaultScopeType,
    scopeId: defaultScopeId,
  });

  const roomTypesByProperty = useMemo(() => {
    const map = new Map<number, any[]>();
    (roomTypes || []).forEach((roomType) => {
      const propertyId = roomType?.property?.id;
      if (!propertyId) return;
      if (!map.has(propertyId)) {
        map.set(propertyId, []);
      }
      map.get(propertyId)?.push(roomType);
    });
    return map;
  }, [roomTypes]);

  useEffect(() => {
    if (propertyRoomTypesLoaded || !properties || properties.length === 0) {
      return;
    }

    let cancelled = false;

    const loadRoomTypes = async () => {
      setPropertiesLoading(true);
      try {
        const results = await Promise.all(
          properties.map(async (property) => {
            const response = await fetch(`/api/admin/properties/${property.id}/room-types`, {
              credentials: 'include',
              headers: {
                Accept: 'application/json',
              },
            });
            if (!response.ok) {
              const message = await response.text();
              throw new Error(message || `Failed to load room types for property ${property.id}`);
            }
            const payload = await response.json();
            return { propertyId: property.id, payload: payload?.data };
          })
        );

        if (cancelled) return;

        const flattenedRoomTypes: any[] = [];
        const payloadMap: Record<number, { property: any; roomTypes: any[] }> = {};

        results.forEach((result) => {
          if (!result?.payload) {
            return;
          }
          payloadMap[result.propertyId] = result.payload;
          const propertyInfo = result.payload.property;
          (result.payload.roomTypes || []).forEach((roomType: any) => {
            flattenedRoomTypes.push({
              ...roomType,
              property: {
                id: propertyInfo?.id,
                name: propertyInfo?.name,
              },
            });
          });
        });

        setPropertyRoomTypeData(payloadMap);
        setRoomTypes(flattenedRoomTypes);
        setProperties((prev) =>
          prev.map((property) => {
            const payload = payloadMap[property.id];
            if (!payload) {
              return property;
            }
            return {
              ...property,
              defaultBuffer: payload.property?.defaultBuffer ?? property.defaultBuffer,
              timezone: payload.property?.timezone ?? property.timezone,
              currency: payload.property?.currency ?? property.currency,
              overbookingEnabled:
                payload.property?.overbookingEnabled ?? property.overbookingEnabled,
            };
          })
        );
        setPropertyRoomTypesLoaded(true);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load property room types', error);
        }
      } finally {
        if (!cancelled) {
          setPropertiesLoading(false);
        }
      }
    };

    loadRoomTypes();

    return () => {
      cancelled = true;
    };
  }, [properties, propertyRoomTypesLoaded]);

  const [inventoryPropertyId, setInventoryPropertyId] = useState<number | null>(defaultPropertyId);
  const [inventoryDays, setInventoryDays] = useState(7);
  const [inventoryData, setInventoryData] = useState<any | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryReloadKey, setInventoryReloadKey] = useState(0);

  const formatDateLabel = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const formatWeekdayLabel = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const selectedProperty = inventoryPropertyId
    ? properties.find((prop) => prop.id === inventoryPropertyId) || null
    : null;
  const selectedRoomTypes = inventoryPropertyId
    ? roomTypesByProperty.get(inventoryPropertyId) || []
    : [];

  const activePropertyMeta = propertyEditorPropertyId ? propertyRoomTypeData[propertyEditorPropertyId] : null;

  const resetPropertyEditor = () => {
    setPropertyEditorOpen(false);
    setPropertyEditorLoading(false);
    setPropertyEditorSaving(false);
    setPropertyEditorError(null);
    setPropertyEditorPropertyId(null);
    setPropertyForm(null);
    setRoomTypeForms([]);
  };

  const closePropertyEditor = () => {
    resetPropertyEditor();
  };

  const openPropertyEditorModal = async (propertyId: number) => {
    setPropertyEditorOpen(true);
    setPropertyEditorLoading(true);
    setPropertyEditorError(null);
    setPropertyEditorPropertyId(propertyId);

    const summary = properties.find((prop) => prop.id === propertyId) || null;
    setPropertyForm({
      name: summary?.name || '',
      phone: summary?.phone || '',
      email: summary?.email || '',
      defaultBuffer: summary?.defaultBuffer !== undefined && summary?.defaultBuffer !== null
        ? String(summary.defaultBuffer)
        : '0',
      timezone: summary?.timezone || 'Asia/Kolkata',
      overbookingEnabled: summary?.overbookingEnabled !== false,
      address: summary?.address || '',
      city: summary?.city || '',
      state: summary?.state || '',
      pincode: summary?.pincode || '',
      currency: summary?.currency || 'INR',
    });

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/room-types`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load property room types');
      }
      const json = await response.json();
      const payload = json?.data;

      if (payload?.property) {
        setPropertyForm((prev: any) => ({
          ...(prev || {}),
          defaultBuffer:
            payload.property.defaultBuffer !== undefined && payload.property.defaultBuffer !== null
              ? String(payload.property.defaultBuffer)
              : prev?.defaultBuffer ?? '0',
          timezone: payload.property.timezone || prev?.timezone || 'Asia/Kolkata',
          overbookingEnabled:
            payload.property.overbookingEnabled !== undefined
              ? payload.property.overbookingEnabled
              : prev?.overbookingEnabled ?? true,
          currency: payload.property.currency || prev?.currency || 'INR',
        }));
      }

      const mappedRoomTypes = (payload?.roomTypes || []).map((roomType: any, index: number) => ({
        id: roomType.id,
        tempId: `existing-${roomType.id}`,
        name: roomType.name || '',
        code: roomType.code || '',
        baseRooms:
          roomType.baseRooms !== undefined && roomType.baseRooms !== null
            ? String(roomType.baseRooms)
            : '0',
        capacity:
          roomType.capacity !== undefined && roomType.capacity !== null
            ? String(roomType.capacity)
            : '1',
        description: roomType.description || '',
        isActive: roomType.isActive !== false,
        ratePlanPrice:
          roomType?.ratePlan?.seasonalPrice !== undefined && roomType?.ratePlan?.seasonalPrice !== null
            ? String(Number(roomType.ratePlan.seasonalPrice))
            : '',
        sortOrder:
          roomType.sortOrder !== undefined && roomType.sortOrder !== null
            ? String(roomType.sortOrder)
            : String(index),
        inventorySummary: roomType.inventorySummary || null,
      }));
      setRoomTypeForms(mappedRoomTypes);
      setPropertyRoomTypeData((prev) => ({
        ...prev,
        [propertyId]: payload,
      }));
    } catch (error: any) {
      console.error('Failed to load property editor data', error);
      setPropertyEditorError(error?.message || 'Failed to load property data');
    } finally {
      setPropertyEditorLoading(false);
    }
  };

  const handlePropertyFormChange = (field: string, value: any) => {
    setPropertyForm((prev: any) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const updateRoomTypeField = (index: number, field: string, value: any) => {
    setRoomTypeForms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeRoomTypeRow = (index: number) => {
    setRoomTypeForms((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addRoomTypeRow = () => {
    setRoomTypeForms((prev) => [
      ...prev,
      {
        id: null,
        tempId: `new-${Date.now()}`,
        name: '',
        code: '',
        baseRooms: '0',
        capacity: '1',
        description: '',
        isActive: true,
        ratePlanPrice: '',
        sortOrder: String(prev.length),
        inventorySummary: null,
      },
    ]);
  };

  const handlePropertyEditorSave = async () => {
    if (!propertyEditorPropertyId || !propertyForm) {
      return;
    }

    if (!roomTypeForms || roomTypeForms.length === 0) {
      setPropertyEditorError('Add at least one room type before saving.');
      return;
    }

    const invalidRoomType = roomTypeForms.find((roomType) => !roomType.name || !roomType.name.trim());
    if (invalidRoomType) {
      setPropertyEditorError('Every room type needs a name.');
      return;
    }

    const hasInvalidPrice = roomTypeForms.some((roomType) => {
      if (roomType.ratePlanPrice === '' || roomType.ratePlanPrice === null || roomType.ratePlanPrice === undefined) {
        return false;
      }
      const parsed = Number(roomType.ratePlanPrice);
      return Number.isNaN(parsed);
    });
    if (hasInvalidPrice) {
      setPropertyEditorError('BAR price must be a valid number.');
      return;
    }

    setPropertyEditorSaving(true);
    setPropertyEditorError(null);

    try {
      const propertyId = propertyEditorPropertyId;
      const propertyPayload = {
        name: propertyForm.name?.trim() || propertyForm.name,
        phone: propertyForm.phone?.trim() || null,
        email: propertyForm.email?.trim() || null,
        defaultBuffer: Number(propertyForm.defaultBuffer ?? 0) || 0,
        timezone: propertyForm.timezone || 'Asia/Kolkata',
        overbookingEnabled: propertyForm.overbookingEnabled !== false,
        address: propertyForm.address?.trim() || null,
        city: propertyForm.city?.trim() || null,
        state: propertyForm.state?.trim() || null,
        pincode: propertyForm.pincode?.trim() || null,
        currency: propertyForm.currency || 'INR',
      };

      const propertyResponse = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(propertyPayload),
      });

      if (!propertyResponse.ok) {
        const message = await propertyResponse.text();
        throw new Error(message || 'Failed to update property details.');
      }

      const propertyJson = await propertyResponse.json();
      const updatedProperty = propertyJson?.property || propertyJson?.data?.property || null;

      const roomTypesPayload = roomTypeForms.map((roomType, index) => ({
        ...(roomType.id ? { id: roomType.id } : {}),
        name: roomType.name?.trim(),
        code: roomType.code?.trim() || undefined,
        baseRooms: Number(roomType.baseRooms ?? 0) || 0,
        capacity: Number(roomType.capacity ?? 1) || 1,
        isActive: roomType.isActive !== false,
        description: roomType.description?.trim() || null,
        sortOrder: Number(roomType.sortOrder ?? index),
        ratePlanPrice:
          roomType.ratePlanPrice === '' || roomType.ratePlanPrice === null
            ? null
            : Number(roomType.ratePlanPrice),
      }));

      const roomTypeResponse = await fetch(`/api/admin/properties/${propertyId}/room-types`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ roomTypes: roomTypesPayload }),
      });

      if (!roomTypeResponse.ok) {
        const message = await roomTypeResponse.text();
        throw new Error(message || 'Failed to save room types.');
      }

      const roomTypeJson = await roomTypeResponse.json();
      const payload = roomTypeJson?.data;

      if (payload?.roomTypes) {
        setRoomTypeForms(
          payload.roomTypes.map((roomType: any, index: number) => ({
            id: roomType.id,
            tempId: `existing-${roomType.id}`,
            name: roomType.name || '',
            code: roomType.code || '',
            baseRooms:
              roomType.baseRooms !== undefined && roomType.baseRooms !== null
                ? String(roomType.baseRooms)
                : '0',
            capacity:
              roomType.capacity !== undefined && roomType.capacity !== null
                ? String(roomType.capacity)
                : '1',
            description: roomType.description || '',
            isActive: roomType.isActive !== false,
            ratePlanPrice:
              roomType?.ratePlan?.seasonalPrice !== undefined && roomType?.ratePlan?.seasonalPrice !== null
                ? String(Number(roomType.ratePlan.seasonalPrice))
                : '',
            sortOrder:
              roomType.sortOrder !== undefined && roomType.sortOrder !== null
                ? String(roomType.sortOrder)
                : String(index),
            inventorySummary: roomType.inventorySummary || null,
          }))
        );

        setPropertyRoomTypeData((prev) => ({
          ...prev,
          [propertyId]: payload,
        }));

        setRoomTypes((prev) => {
          const filtered = prev.filter((roomType) => roomType?.property?.id !== propertyId);
          const mapped = payload.roomTypes.map((roomType: any) => ({
            ...roomType,
            property: {
              id: payload.property.id,
              name: payload.property.name,
            },
          }));
          return [...filtered, ...mapped];
        });
      }

      if (updatedProperty) {
        setProperties((prev) =>
          prev.map((property) => (property.id === propertyId ? { ...property, ...updatedProperty } : property))
        );
      }

      setInventoryReloadKey((key) => key + 1);
      resetPropertyEditor();
    } catch (error: any) {
      console.error('Failed to save property configuration', error);
      setPropertyEditorError(error?.message || 'Failed to save property configuration.');
    } finally {
      setPropertyEditorSaving(false);
    }
  };

  // Filter loyalty members based on search
  const filteredLoyalty = loyalty.filter(account => {
    if (!loyaltySearch) return true;
    const search = loyaltySearch.toLowerCase();
    return (
      account.userName?.toLowerCase().includes(search) ||
      account.userEmail?.toLowerCase().includes(search) ||
      account.memberNumber?.includes(search)
    );
  });

  const filteredUsers = usersList.filter(user => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(search)) ||
      user.email?.toLowerCase().includes(search) ||
      (user.phone && user.phone.toLowerCase().includes(search)) ||
      user.roleName?.toLowerCase().includes(search)
    );
  });

  // Update time on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Debug: Log received data
  useEffect(() => {
    console.log('Admin Data Received:', {
      brands: brands?.length,
      properties: properties?.length,
      bookings: bookings?.length,
      loyalty: loyaltyCount,
      users: users?.length,
      stats
    });
  }, [brands, properties, bookings, loyalty, users, stats]);

  useEffect(() => {
    setUsersList(users || []);
  }, [users]);

useEffect(() => {
  if (inviteForm.scopeType === 'PROPERTY') {
    if ((!inviteForm.scopeId || !properties.find(p => p.id === inviteForm.scopeId)) && properties.length > 0) {
      setInviteForm(prev => ({ ...prev, scopeId: properties[0].id }));
    }
  } else if (inviteForm.scopeType === 'BRAND') {
    if ((!inviteForm.scopeId || !brands.find(b => b.id === inviteForm.scopeId)) && brands.length > 0) {
      setInviteForm(prev => ({ ...prev, scopeId: brands[0].id }));
    }
  } else {
    if (inviteForm.scopeId !== null) {
      setInviteForm(prev => ({ ...prev, scopeId: null }));
    }
  }
}, [inviteForm.scopeType, inviteForm.scopeId, properties, brands]);

useEffect(() => {
  if (newUserForm.scopeType === 'PROPERTY') {
    if ((!newUserForm.scopeId || !properties.find(p => p.id === newUserForm.scopeId)) && properties.length > 0) {
      setNewUserForm(prev => ({ ...prev, scopeId: properties[0].id }));
    }
  } else if (newUserForm.scopeType === 'BRAND') {
    if ((!newUserForm.scopeId || !brands.find(b => b.id === newUserForm.scopeId)) && brands.length > 0) {
      setNewUserForm(prev => ({ ...prev, scopeId: brands[0].id }));
    }
  } else {
    if (newUserForm.scopeId !== null) {
      setNewUserForm(prev => ({ ...prev, scopeId: null }));
    }
  }
}, [newUserForm.scopeType, newUserForm.scopeId, properties, brands]);

  useEffect(() => {
    if (!inventoryPropertyId) {
      setInventoryData(null);
      return;
    }

    const controller = new AbortController();

    const fetchInventory = async () => {
      setInventoryLoading(true);
      setInventoryError(null);

      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + inventoryDays);

        const params = new URLSearchParams({
          propertyId: inventoryPropertyId.toString(),
          start: start.toISOString(),
          end: end.toISOString(),
        });

        const url = `/api/inventory/availability?${params.toString()}`;

        const response = await fetch(url, {
          signal: controller.signal,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });
        const contentType = response.headers.get('content-type') || '';
        let data: any = null;

        try {
          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const rawText = await response.text();
            throw new Error(
              response.ok
                ? 'Inventory API returned an unexpected response format.'
                : rawText || `Failed to load inventory (status ${response.status})`
            );
          }
        } catch (parseError: any) {
          if (!contentType.includes('application/json')) {
            throw parseError;
          }
          throw new Error('Unable to parse inventory data from the server.');
        }

        if (!response.ok || data?.success === false) {
          throw new Error(
            data?.error || `Failed to load inventory (status ${response.status})`
          );
        }

        setInventoryData(data);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Inventory fetch error:', error);
        setInventoryError(error.message || 'Failed to load inventory data');
        setInventoryData(null);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();

    return () => controller.abort();
  }, [inventoryPropertyId, inventoryDays, inventoryReloadKey]);

  // Handle Invite Submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMessage(null);
    setInviteLink(null);

    const trimmedEmail = inviteForm.email.trim();
    if (!trimmedEmail) {
      setInviteMessage({ type: 'error', text: 'Email address is required.' });
      setInviteLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inviteForm,
          email: trimmedEmail,
        })
      });

      const data = await response.json();

      if (response.ok) {
        const inviteUrl = data?.invite?.inviteUrl;
        setInviteMessage({
          type: 'success',
          text: `Invite sent to ${inviteForm.email}!`,
        });
        setInviteLink(inviteUrl || null);
        setInviteForm({ email: '', roleKey: 'STAFF_FRONTDESK', scopeType: defaultScopeType, scopeId: defaultScopeId });
      } else {
        setInviteMessage({ type: 'error', text: data.error || 'Failed to send invite' });
        setInviteLink(null);
      }
    } catch (error) {
      setInviteMessage({ type: 'error', text: 'Network error. Please try again.' });
      setInviteLink(null);
    } finally {
      setInviteLoading(false);
    }
  };

  // Show loading state only if auth is loading AND we haven't timed out
  // Also redirect if unauthenticated (but show loading during redirect)
  if (authStatus === 'loading' && !authTimeout) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show loading while redirecting
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
        <title>Admin Dashboard | POD N BEYOND</title>
        <meta name="description" content="POD N BEYOND Admin Dashboard" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
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
              <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
              <p className="text-neutral-300 text-sm">POD N BEYOND Group Management</p>
            </div>
          </div>

          {/* Header Tabs - Like Communication Hub */}
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/admin/bookings">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/bookings')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                📋 Bookings
              </button>
            </a>
            <a href="/admin/communication-hub">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/communication-hub') ||
                router.asPath?.startsWith('/admin/templates') ||
                router.asPath?.startsWith('/admin/analytics')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                💬 Communication Hub
              </button>
            </a>
            <a href="/admin/loyalty">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/loyalty')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                ⭐ Loyalty Program
              </button>
            </a>
            <a href="/admin/integrations">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/integrations')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                ⚙️ Integrations
              </button>
            </a>
          </div>
        </Container>
      </section>

      {/* Tabs - Removed Payment, OTA, Integrations */}
      <section className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <Container>
          <div className="flex space-x-8 overflow-x-auto py-4">
            {['overview', 'brands', 'properties', 'bookings', 'loyalty', 'users', 'cms'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 font-semibold capitalize whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab === 'cms' ? 'CMS' : tab}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-12">
        <Container>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard Overview</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Total Brands</div>
                    <div className="text-4xl font-bold text-capsule-500">{stats.brands}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {brands.filter(b => b.status === 'ACTIVE').length} active
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Total Properties</div>
                    <div className="text-4xl font-bold text-smart-500">{stats.properties}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      Across {brands.length} brands
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Total Bookings</div>
                    <div className="text-4xl font-bold text-sanctuary-500">
                      {bookingsLoading ? '...' : bookingsCount}
                    </div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {bookingsLoading ? 'Loading...' : 'Click Bookings tab to view'}
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Loyalty Members</div>
                    <div className="text-4xl font-bold text-sauna-500">
                      {loyaltyLoading ? '...' : loyaltyCount}
                    </div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {loyaltyLoading ? 'Loading...' : 'Click Loyalty tab to view'}
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Staff Members</div>
                    <div className="text-4xl font-bold text-neutral-900">{usersList?.length || 0}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {usersList?.filter(u => u.roleKey === 'SUPERADMIN' || u.roleKey === 'ADMIN').length || 0} admins
                    </div>
                  </Card>
                </div>
              </div>

              {/* Recent Bookings */}
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-4">Recent Bookings</h3>
                <Card variant="default" padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-100 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Guest</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Check-in</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Room</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {bookings && bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                          <tr key={booking.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-neutral-900">{booking.guestName}</div>
                              <div className="text-sm text-neutral-500">{booking.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {new Date(booking.checkIn).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              <div className="font-medium text-neutral-900">
                                {booking.roomType?.name || booking.roomType?.type || 'N/A'}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {booking.property?.name || booking.source || 'Direct'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant={
                                  booking.status === 'CONFIRMED' ? 'success' :
                                  booking.status === 'HOLD' ? 'warning' :
                                  booking.status === 'PENDING' ? 'warning' :
                                  booking.status === 'CANCELLED' ? 'error' :
                                  booking.status === 'FAILED' ? 'error' :
                                  booking.status === 'NO_SHOW' ? 'error' : 'neutral'
                                }
                                size="sm"
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-semibold text-neutral-900">
                              ₹{Number(booking.totalPrice || 0).toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                              <p className="mb-2">No bookings data available</p>
                              <p className="text-sm">Test data: {bookings?.length || 0} bookings in database</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Brands Tab */}
          {activeTab === 'brands' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Brand Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {brands.map((brand) => (
                  <Card key={brand.id} variant="default" padding="lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {brand.logoUrl && (
                          <img src={brand.logoUrl} alt={brand.name} className="h-10" />
                        )}
                        <div>
                          <h3 className="font-bold text-lg text-neutral-900">{brand.name}</h3>
                          <p className="text-sm text-neutral-600">{brand.tagline}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={brand.status === 'ACTIVE' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {brand.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-neutral-600">Properties:</span>
                        <span className="ml-2 font-semibold">{brand._count?.properties || 0}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Color:</span>
                        <div className="inline-flex items-center ml-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-neutral-300"
                            style={{ backgroundColor: brand.primaryColor }}
                          />
                        </div>
                      </div>
                    </div>

                    {brand.targetAudience && (
                      <p className="text-sm text-neutral-700 border-t border-neutral-100 pt-4">
                        <span className="font-semibold">Target:</span> {brand.targetAudience}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <a href={`/brands/${brand.slug}`}>
                        <Button variant="ghost" size="sm" fullWidth>
                          View Brand Page →
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Property Management</h2>
              {propertiesLoading && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                  Syncing latest room types and inventory data...
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-6">
                {properties.map((property) => {
                  const propertyRoomTypes = roomTypesByProperty.get(property.id) || [];
                  const totalBaseRooms = propertyRoomTypes.reduce((sum, roomType) => sum + (roomType.baseRooms || 0), 0);
                  return (
                  <Card key={property.id} variant="default" padding="lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-xl text-neutral-900">{property.name}</h3>
                          {property.brand && (
                            <Badge variant="neutral" size="sm">{property.brand.name}</Badge>
                          )}
                        </div>
                        <p className="text-neutral-600">
                          📍 {property.address || property.location}, {property.city}, {property.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-smart-500">⭐</span>
                          <span className="font-semibold">{property.rating}</span>
                          <span className="text-sm text-neutral-500">({property.totalRatings})</span>
                        </div>
                        <Badge variant="success" size="sm">{property.status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-neutral-600">Room Types:</span>
                        <span className="ml-2 font-semibold">{propertyRoomTypes.length}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Base Pods:</span>
                        <span className="ml-2 font-semibold">{totalBaseRooms}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Phone:</span>
                        <span className="ml-2 font-semibold">{property.phone}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Email:</span>
                        <span className="ml-2 font-semibold text-xs">{property.email}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-neutral-100">
                      <a href={`/locations/${property.slug}`} className="flex-1">
                        <Button variant="ghost" size="sm" fullWidth>View Page</Button>
                      </a>
                      <Button variant="primary" size="sm" onClick={() => openPropertyEditorModal(property.id)}>
                        Edit
                      </Button>
                    </div>
                  </Card>
                );
                })}
              </div>

              {properties.length > 0 && (
                <Card variant="default" padding="lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">Inventory Snapshot</h3>
                      <p className="text-sm text-neutral-500">
                        Buffer-aware availability for the next {inventoryDays} days.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        className="px-3 py-2 border border-neutral-200 rounded-md text-sm bg-white"
                        value={inventoryPropertyId ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setInventoryPropertyId(value ? Number(value) : null);
                        }}
                      >
                        {properties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="px-3 py-2 border border-neutral-200 rounded-md text-sm bg-white"
                        value={inventoryDays}
                        onChange={(event) => setInventoryDays(Number(event.target.value))}
                      >
                        {[7, 14, 30].map((days) => (
                          <option key={days} value={days}>
                            {days} days
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInventoryReloadKey((key) => key + 1)}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {inventoryError && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                      {inventoryError}
                    </div>
                  )}

                  {inventoryLoading && (
                    <div className="py-6 text-sm text-neutral-500">Loading inventory...</div>
                  )}

                  {!inventoryLoading && inventoryData && inventoryData.roomTypes && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                        <span>
                          Window:{' '}
                          <strong>
                            {formatDateLabel(inventoryData.range.start)} → {formatDateLabel(inventoryData.range.end)}
                          </strong>
                        </span>
                        {selectedProperty && (
                          <span>
                            Timezone: <strong>{selectedProperty.timezone || 'Asia/Kolkata'}</strong>
                          </span>
                        )}
                        <span>
                          Buffer: <strong>{inventoryData.property?.defaultBuffer ?? selectedProperty?.defaultBuffer ?? 0}%</strong>
                        </span>
                        <span>
                          Room types tracked:{' '}
                          <strong>{selectedRoomTypes.length}</strong>
                        </span>
                      </div>

                      {inventoryData.roomTypes.length === 0 && (
                        <div className="text-sm text-neutral-500">No inventory configured for this property.</div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {inventoryData.roomTypes.map((roomType: any) => (
                          <div key={roomType.roomTypeId} className="border border-neutral-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-neutral-900">{roomType.name}</h4>
                                <p className="text-xs text-neutral-500">
                                  Capacity {roomType.capacity} · Base {roomType.baseRooms}
                                </p>
                              </div>
                              <div className="text-right text-xs text-neutral-500">
                                <div>
                                  Free to sell total:{' '}
                                  <span className="font-semibold text-neutral-900">
                                    {roomType.summary.totalFreeToSell}
                                  </span>
                                </div>
                                <div>
                                  Booked:{' '}
                                  <span className="font-semibold text-neutral-900">
                                    {roomType.summary.totalBooked}
                                  </span>
                                </div>
                                <div>
                                  Holds:{' '}
                                  <span className="font-semibold text-neutral-900">
                                    {roomType.summary.totalHolds}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {roomType.availability.slice(0, Math.min(inventoryDays, 9)).map((day: any) => (
                                <div
                                  key={day.date}
                                  className="border border-neutral-200 rounded-md px-3 py-2 bg-neutral-50"
                                >
                                  <div className="font-semibold text-neutral-900">
                                    {formatWeekdayLabel(day.date)}
                                  </div>
                                  <div className="text-neutral-500">{formatDateLabel(day.date)}</div>
                                  <div className="mt-2">
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Sellable</span>
                                      <span className="font-semibold text-neutral-900">{day.sellable}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Booked</span>
                                      <span className="font-semibold text-neutral-900">{day.booked}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Holds</span>
                                      <span className="font-semibold text-neutral-900">{day.holds}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Free</span>
                                      <span className="font-semibold text-sanctuary-500">{day.freeToSell}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!inventoryLoading && !inventoryData && !inventoryError && (
                    <div className="text-sm text-neutral-500">Select a property to view inventory.</div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Bookings Management</h2>
                <div className="text-sm text-neutral-600">
                  Total: {bookings.length} bookings
                </div>
              </div>
              
              <Card variant="default" padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-900 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Guest</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Room</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Check-in</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Nights</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {bookings.map((booking) => {
                        const nights = Math.ceil(
                          (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <tr key={booking.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono text-neutral-500">
                              #{booking.id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-neutral-900">{booking.guestName}</div>
                              <div className="text-sm text-neutral-500">{booking.email}</div>
                              {booking.phone && (
                                <div className="text-xs text-neutral-400">{booking.phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              <div className="font-medium text-neutral-900">
                                {booking.roomType?.name || booking.roomType?.type || 'N/A'}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {booking.property?.name || booking.source || 'Direct'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {new Date(booking.checkIn).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {nights} {nights === 1 ? 'night' : 'nights'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant={
                                  booking.status === 'CONFIRMED' ? 'success' :
                                  booking.status === 'HOLD' ? 'warning' :
                                  booking.status === 'PENDING' ? 'warning' :
                                  booking.status === 'CANCELLED' ? 'error' :
                                  booking.status === 'FAILED' ? 'error' :
                                  booking.status === 'NO_SHOW' ? 'error' : 'neutral'
                                }
                                size="sm"
                              >
                                {booking.status}
                              </Badge>
                              {booking.externalChannel && (
                                <div className="text-xs text-neutral-500 mt-1">
                                  via {booking.externalChannel}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-neutral-900">₹{Number(booking.totalPrice || 0).toLocaleString()}</div>
                              {booking.specialRequests && (
                                <div className="text-xs text-neutral-500 mt-1">Has special requests</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {bookings.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  No bookings yet. Test data should be seeded.
                </div>
              )}
            </div>
          )}

          {/* Loyalty Tab */}
          {activeTab === 'loyalty' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Loyalty Program</h2>
                  <div className="text-sm text-neutral-600 mt-1">
                    {loyaltyLoading ? 'Loading...' : `${loyaltyCount} total members`}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/admin/loyalty/points-rules')}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Points Rules
                  </button>
                  <button
                    onClick={() => router.push('/admin/loyalty/perks')}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Perks
                  </button>
                  <button
                    onClick={() => router.push('/admin/loyalty/campaigns')}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Campaigns
                  </button>
                  <button
                    onClick={() => router.push('/admin/loyalty/redemption-items')}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Redemption Catalog
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <Card variant="default" padding="md">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by name, email, or member number..."
                      value={loyaltySearch}
                      onChange={(e) => setLoyaltySearch(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="text-sm text-neutral-600">
                    {filteredLoyalty.length} results
                  </div>
                </div>
              </Card>

              {/* Members List Table */}
              {filteredLoyalty.length > 0 ? (
                <Card variant="default" padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Tier
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Points
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Stays
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {filteredLoyalty.map((account) => (
                          <tr key={account.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-semibold text-neutral-900">
                                  {account.userName || 'N/A'}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  Member #{account.memberNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="text-neutral-900">{account.userEmail}</div>
                                {account.userPhone && (
                                  <div className="text-neutral-500">{account.userPhone}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={
                                  account.tier === 'PLATINUM' ? 'neutral' :
                                  account.tier === 'GOLD' ? 'smart' : 'capsule'
                                }
                                size="sm"
                              >
                                {account.tier}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="font-semibold text-neutral-900">
                                {account.points.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-neutral-900">
                                {account.lifetimeStays || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => {
                                  setEditingMember(account);
                                  setBonusPoints(0);
                                  setBonusStays(0);
                                  setBonusReason('');
                                  setShowEditModal(true);
                                }}
                                className="text-neutral-900 hover:text-neutral-700 font-semibold text-sm"
                              >
                                Manage Member
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {loyaltySearch ? 'No members found matching your search.' : 'No loyalty members yet.'}
                </div>
              )}
            </div>
          )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">User Management</h2>
              <p className="text-neutral-600 mt-1">Invite staff members, manage permissions, and track access scopes.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setInviteMessage(null);
                  setShowInviteModal(true);
                }}
              >
                Invite User
              </Button>
              <Button variant="primary" onClick={() => setShowAddUserModal(true)}>
                Add User
              </Button>
            </div>
          </div>

          {/* Search + Summary */}
          <Card variant="default" padding="md">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="text-sm text-neutral-600">
                {filteredUsers.length} of {usersList.length} users
              </div>
            </div>
          </Card>

          {/* Users Table */}
          {filteredUsers.length > 0 ? (
            <Card variant="default" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Scope</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {filteredUsers.map((user) => {
                      const scopeLabel = user.scopeType === 'ORG'
                        ? 'All Locations'
                        : user.scopeType === 'PROPERTY'
                          ? properties.find(p => p.id === user.scopeId)?.name || `Property #${user.scopeId}`
                          : brands.find(b => b.id === user.scopeId)?.name || `Brand #${user.scopeId}`;

                      return (
                        <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-semibold text-neutral-900">{user.name || 'Unnamed User'}</div>
                              <div className="text-sm text-neutral-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="neutral" size="sm">
                              {user.roleName || user.roleKey}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">{scopeLabel}</div>
                            <div className="text-xs text-neutral-500 uppercase">{user.scopeType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">{user.phone || '—'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                const nameParts = (user.name || '').trim().split(/\s+/);
                                const first = nameParts.shift() || '';
                                const last = nameParts.join(' ');
                                setEditingUser(user);
                                setUserRole(user.roleKey || 'STAFF_FRONTDESK');
                                setUserScopeType(user.scopeType || 'ORG');
                                setUserScopeId(user.scopeType === 'ORG' ? null : user.scopeId || null);
                                setUserFirstName(first);
                                setUserLastName(last);
                                setUserPhone(user.phone || '');
                                setShowUserModal(true);
                              }}
                              className="text-neutral-900 hover:text-neutral-700 font-semibold text-sm"
                            >
                              Manage User
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              {userSearch ? 'No users found for this search.' : 'No staff members yet.'}
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="bordered" padding="lg">
              <h4 className="font-bold text-sm text-neutral-700 mb-2">📧 Invite Process</h4>
              <p className="text-sm text-neutral-600">
                Users receive an email with a secure link valid for 7 days
              </p>
            </Card>
            
            <Card variant="bordered" padding="lg">
              <h4 className="font-bold text-sm text-neutral-700 mb-2">🔒 Security</h4>
              <p className="text-sm text-neutral-600">
                Magic links for authentication - no passwords required
              </p>
            </Card>
            
            <Card variant="bordered" padding="lg">
              <h4 className="font-bold text-sm text-neutral-700 mb-2">⚡ Instant Access</h4>
              <p className="text-sm text-neutral-600">
                Staff can log in immediately after accepting the invite
              </p>
            </Card>
          </div>

          {/* Role Descriptions */}
          <Card variant="default" padding="lg">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Role Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  STAFF_FRONTDESK
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Check-in/out guests, view bookings, basic room status (property-scoped)
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  STAFF_OPS
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Manage inventory, update pricing, room availability (property-scoped)
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  MANAGER
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Full property management, staff management, revenue reports, refunds
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  ADMIN
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Group-wide access: all properties, OTA management, payment settings
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  SUPERADMIN
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Platform owner: full system access, feature flags, user impersonation
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CMS Tab */}
      {activeTab === 'cms' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Content Management System</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <Card variant="default" padding="lg">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">📸 Image Management</h3>
                  <p className="text-neutral-600 mb-6">Upload and manage property images</p>
                  
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer">
                      <svg className="w-12 h-12 mx-auto mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-neutral-600">Click to upload images</p>
                      <p className="text-sm text-neutral-500 mt-1">or drag and drop</p>
                    </div>
                    
                    <Button variant="primary" fullWidth>
                      Browse Images
                    </Button>
                  </div>
                </Card>

                {/* Content Sections */}
                <Card variant="default" padding="lg">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">📝 Content Sections</h3>
                  <p className="text-neutral-600 mb-6">Manage homepage and property content</p>
                  
                  <div className="space-y-3">
                    {['Hero Section', 'About Section', 'Amenities', 'Testimonials', 'Contact Info'].map((section, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                        <span className="font-medium text-neutral-900">{section}</span>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Gallery Management */}
                <Card variant="default" padding="lg" className="md:col-span-2">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">🖼️ Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-200 transition-colors cursor-pointer">
                        <span className="text-sm">Slot {i}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="primary" size="sm">Upload to Gallery</Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Payment Gateway Tab - Removed, use Integrations header tab */}
          {false && activeTab === 'payment' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Payment Gateway Settings</h2>
              
              <Card variant="default" padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-8" />
                    <div>
                      <h3 className="font-bold text-lg">Razorpay Integration</h3>
                      <p className="text-sm text-neutral-600">Secure payment processing</p>
                    </div>
                  </div>
                  <Badge variant={paymentSettings.razorpayKeyId ? 'success' : 'warning'}>
                    {paymentSettings.razorpayKeyId ? 'Configured' : 'Not Configured'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.razorpayKeyId}
                      onChange={(e) => setPaymentSettings({...paymentSettings, razorpayKeyId: e.target.value})}
                      placeholder="rzp_test_xxxxxxxxxxxxx"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <span className="font-medium text-neutral-900">Test Mode</span>
                      <p className="text-sm text-neutral-600">Use test credentials for development</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isTestMode}
                        onChange={(e) => setPaymentSettings({...paymentSettings, isTestMode: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <span className="font-medium text-neutral-900">Auto Capture</span>
                      <p className="text-sm text-neutral-600">Automatically capture payments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.autoCapture}
                        onChange={(e) => setPaymentSettings({...paymentSettings, autoCapture: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <Button variant="primary" size="lg" fullWidth>
                      Save Payment Settings
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Test Payment */}
              <Card variant="bordered" padding="lg">
                <h3 className="font-bold text-lg mb-3">🧪 Test Payment Integration</h3>
                <p className="text-neutral-600 mb-4">Verify your Razorpay integration is working</p>
                <Button variant="secondary">Run Test Payment</Button>
              </Card>
            </div>
          )}

          {/* Integrations Tab - Removed, use Integrations header tab */}
          {false && activeTab === 'integrations' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Third-Party Integrations</h2>
                  <p className="text-neutral-600 mt-1">Manage all third-party service configurations</p>
                </div>
              </div>
            </div>
          )}

          {/* OTA Integration Tab - Removed, use Integrations header tab */}
          {false && activeTab === 'ota' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">OTA Channel Integration</h2>
                  <p className="text-neutral-600 mt-1">Connect with online travel agencies</p>
                </div>
                <Button variant="primary">Sync All Channels</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otaChannels.map((channel) => (
                  <Card key={channel.id} variant="default" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-neutral-900">{channel.name}</h3>
                        <p className="text-sm text-neutral-600">
                          {channel.connected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={channel.connected ? 'success' : 'neutral'}>
                          {channel.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Badge variant={channel.enabled ? 'success' : 'warning'}>
                          {channel.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={channel.apiKey}
                          onChange={(e) => {
                            const updated = otaChannels.map(c => 
                              c.id === channel.id ? {...c, apiKey: e.target.value} : c
                            );
                            setOtaChannels(updated);
                          }}
                          placeholder="Enter API key..."
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <span className="text-sm font-medium">Enable Channel</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={channel.enabled}
                            onChange={(e) => {
                              const updated = otaChannels.map(c => 
                                c.id === channel.id ? {...c, enabled: e.target.checked} : c
                              );
                              setOtaChannels(updated);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="primary" size="sm" fullWidth>Connect</Button>
                        <Button variant="secondary" size="sm" fullWidth>Test</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Sync Status */}
              <Card variant="bordered" padding="lg">
                <h3 className="font-bold text-lg mb-3">📊 Last Sync Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Last successful sync:</span>
                    <span className="font-semibold">Never (channels not connected)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Next scheduled sync:</span>
                    <span className="font-semibold">Every 15 minutes (when enabled)</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Container>
      </section>

      {/* Manage Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Manage Member</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setBonusPoints(0);
                    setBonusStays(0);
                    setBonusReason('');
                  }}
                  className="text-neutral-500 hover:text-neutral-900 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* SECTION 1: Contact Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-neutral-900 border-b pb-2">Contact Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Name</label>
                    <p className="text-neutral-900">{editingMember.userName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Member #</label>
                    <p className="text-neutral-900 font-mono">{editingMember.memberNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Member Since</label>
                    <p className="text-neutral-900">{new Date(editingMember.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Status</label>
                    <Badge
                      variant={
                        editingMember.tier === 'PLATINUM' ? 'neutral' :
                        editingMember.tier === 'GOLD' ? 'smart' : 'capsule'
                      }
                      size="sm"
                    >
                      {editingMember.tier}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editingMember.userEmail}
                      onChange={(e) => setEditingMember({...editingMember, userEmail: e.target.value})}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editingMember.userPhone || ''}
                      onChange={(e) => setEditingMember({...editingMember, userPhone: e.target.value})}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/loyalty/accounts/${editingMember.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: editingMember.userEmail,
                            phone: editingMember.userPhone
                          })
                        });

                        if (response.ok) {
                          alert('Contact info updated successfully!');
                          window.location.reload();
                        } else {
                          const error = await response.json();
                          alert('Failed to update: ' + error.error);
                        }
                      } catch (error) {
                        alert('Error updating contact info');
                        console.error(error);
                      }
                    }}
                  >
                    Update Contact Info
                  </Button>
                </div>
              </div>

              {/* SECTION 2: Loyalty Management */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-neutral-900 border-b pb-2">Loyalty Management</h4>
                
                {/* Current Balances (Read-only) */}
                <div className="grid grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Current Points</label>
                    <p className="text-2xl font-bold text-neutral-900">{editingMember.points.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Lifetime Stays</label>
                    <p className="text-2xl font-bold text-neutral-900">{editingMember.lifetimeStays || 0}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Current Tier</label>
                    <Badge
                      variant={
                        editingMember.tier === 'PLATINUM' ? 'neutral' :
                        editingMember.tier === 'GOLD' ? 'smart' : 'capsule'
                      }
                      size="md"
                    >
                      {editingMember.tier}
                    </Badge>
                  </div>
                </div>

                {/* Add Bonus Points/Stays */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Add Bonus Points
                    </label>
                    <input
                      type="number"
                      value={bonusPoints}
                      onChange={(e) => setBonusPoints(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      New balance: {(editingMember.points + bonusPoints).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Add Bonus Stays
                    </label>
                    <input
                      type="number"
                      value={bonusStays}
                      onChange={(e) => setBonusStays(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      New total: {editingMember.lifetimeStays + bonusStays}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Reason for Adjustment
                  </label>
                  <textarea
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    placeholder="E.g., Compensation for service issue, promotional bonus, etc."
                    rows={2}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Membership Tier
                  </label>
                  <select
                    value={editingMember.tier}
                    onChange={(e) => setEditingMember({...editingMember, tier: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setBonusPoints(0);
                    setBonusStays(0);
                    setBonusReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      // Only send if there are actual changes
                      if (bonusPoints === 0 && bonusStays === 0 && !bonusReason) {
                        // Just update tier if changed
                        const response = await fetch(`/api/loyalty/accounts/${editingMember.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tier: editingMember.tier })
                        });

                        if (response.ok) {
                          alert('Tier updated successfully!');
                          setShowEditModal(false);
                          setEditingMember(null);
                          window.location.reload();
                        } else {
                          const error = await response.json();
                          alert('Failed to update: ' + error.error);
                        }
                      } else {
                        // Add bonus points/stays
                        const response = await fetch(`/api/loyalty/accounts/${editingMember.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            addPoints: bonusPoints,
                            addStays: bonusStays,
                            reason: bonusReason || 'Admin adjustment',
                            tier: editingMember.tier
                          })
                        });

                        if (response.ok) {
                          alert('Member updated successfully!');
                          setShowEditModal(false);
                          setEditingMember(null);
                          setBonusPoints(0);
                          setBonusStays(0);
                          setBonusReason('');
                          window.location.reload();
                        } else {
                          const error = await response.json();
                          alert('Failed to update: ' + error.error);
                        }
                      }
                    } catch (error) {
                      alert('Error updating member');
                      console.error(error);
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900">Invite Staff Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteMessage(null);
                  setInviteLink(null);
                  setInviteForm({
                    email: '',
                    roleKey: 'STAFF_FRONTDESK',
                    scopeType: defaultScopeType,
                    scopeId: defaultScopeId,
                  });
                }}
                className="text-neutral-500 hover:text-neutral-900 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="staff@podnbeyond.com"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteForm.roleKey}
                    onChange={(e) => setInviteForm({ ...inviteForm, roleKey: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="STAFF_FRONTDESK">Front Desk Staff</option>
                    <option value="STAFF_OPS">Operations Staff</option>
                    <option value="MANAGER">Property Manager</option>
                    <option value="ADMIN">Group Administrator</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Access Scope *
                  </label>
                  <select
                    value={inviteForm.scopeType}
                    onChange={(e) => {
                      const value = e.target.value as StaffScopeType;
                      setInviteForm({
                        ...inviteForm,
                        scopeType: value,
                        scopeId:
                          value === 'ORG'
                            ? null
                            : value === 'PROPERTY'
                              ? properties?.[0]?.id || null
                              : brands?.[0]?.id || null,
                      });
                    }}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="PROPERTY">Single Property</option>
                    <option value="BRAND">Brand-Wide</option>
                    <option value="ORG">Organization-Wide</option>
                  </select>
                </div>
              </div>

              {inviteForm.scopeType !== 'ORG' && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {inviteForm.scopeType === 'PROPERTY' ? 'Property' : 'Brand'} *
                  </label>
                  <select
                    value={inviteForm.scopeId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInviteForm({
                        ...inviteForm,
                        scopeId: value ? parseInt(value, 10) : null,
                      });
                    }}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {(inviteForm.scopeType === 'PROPERTY' ? properties : brands).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {inviteMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    inviteMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <p>{inviteMessage.text}</p>
                  {inviteMessage.type === 'success' && inviteLink && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">Invite Link:</span>{' '}
                      <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="underline break-all">
                        {inviteLink}
                      </a>
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteMessage(null);
                    setInviteLink(null);
                    setInviteForm({
                      email: '',
                      roleKey: 'STAFF_FRONTDESK',
                      scopeType: defaultScopeType,
                      scopeId: defaultScopeId,
                    });
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900">Manage User</h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  setUserFirstName('');
                  setUserLastName('');
                  setUserPhone('');
                }}
                className="text-neutral-500 hover:text-neutral-900 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Name</label>
                    <p className="text-neutral-900 font-semibold">{[userFirstName, userLastName].filter(Boolean).join(' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Joined</label>
                    <p className="text-neutral-900">{new Date(editingUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Email</label>
                    <p className="text-neutral-900">{editingUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Current Role</label>
                    <Badge variant="neutral" size="sm">{editingUser.roleName || editingUser.roleKey}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={userFirstName}
                      onChange={(e) => setUserFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={userLastName}
                      onChange={(e) => setUserLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="STAFF_FRONTDESK">Front Desk Staff</option>
                      <option value="STAFF_OPS">Operations Staff</option>
                      <option value="MANAGER">Property Manager</option>
                      <option value="ADMIN">Group Administrator</option>
                      <option value="SUPERADMIN">Super Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Access Scope
                    </label>
                    <select
                      value={userScopeType}
                      onChange={(e) => {
                        const value = e.target.value as 'PROPERTY' | 'BRAND' | 'ORG';
                        setUserScopeType(value);
                        if (value === 'PROPERTY') {
                          setUserScopeId(properties?.[0]?.id || null);
                        } else if (value === 'BRAND') {
                          setUserScopeId(brands?.[0]?.id || null);
                        } else {
                          setUserScopeId(null);
                        }
                      }}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="PROPERTY">Single Property</option>
                      <option value="BRAND">Brand-Wide</option>
                      <option value="ORG">Organization-Wide</option>
                    </select>
                  </div>
                </div>

                {userScopeType !== 'ORG' && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {userScopeType === 'PROPERTY' ? 'Property' : 'Brand'}
                    </label>
                    <select
                      value={userScopeId || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setUserScopeId(value ? parseInt(value) : null);
                      }}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      {(userScopeType === 'PROPERTY' ? properties : brands).map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setUserFirstName('');
                    setUserLastName('');
                    setUserPhone('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    const trimmedFirst = userFirstName.trim();
                    const trimmedLast = userLastName.trim();
                    const trimmedPhone = userPhone.trim();

                    if (!trimmedFirst || !trimmedLast || !trimmedPhone) {
                      alert('First name, last name, and phone number are required.');
                      return;
                    }

                    try {
                      const response = await fetch(`/api/users/${editingUser.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          roleKey: userRole,
                          scopeType: userScopeType,
                          scopeId: userScopeType === 'ORG' ? null : userScopeId,
                          phone: trimmedPhone,
                          firstName: trimmedFirst,
                          lastName: trimmedLast,
                        }),
                      });

                      if (response.ok) {
                        alert('User updated successfully!');
                        setShowUserModal(false);
                        setEditingUser(null);
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert('Failed to update user: ' + error.error);
                      }
                    } catch (error) {
                      alert('Error updating user');
                      console.error(error);
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900">Add User</h3>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    roleKey: 'STAFF_FRONTDESK',
                    scopeType: defaultScopeType,
                    scopeId: defaultScopeId,
                  });
                }}
                className="text-neutral-500 hover:text-neutral-900 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({...newUserForm, firstName: e.target.value})}
                    placeholder="First name"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({...newUserForm, lastName: e.target.value})}
                    placeholder="Last name"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  placeholder="staff@podnbeyond.com"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={newUserForm.roleKey}
                    onChange={(e) => setNewUserForm({...newUserForm, roleKey: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="STAFF_FRONTDESK">Front Desk Staff</option>
                    <option value="STAFF_OPS">Operations Staff</option>
                    <option value="MANAGER">Property Manager</option>
                    <option value="ADMIN">Group Administrator</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Access Scope *
                  </label>
                  <select
                    value={newUserForm.scopeType}
                    onChange={(e) => {
                      const value = e.target.value as StaffScopeType;
                      setNewUserForm({
                        ...newUserForm,
                        scopeType: value,
                        scopeId: value === 'ORG'
                          ? null
                          : value === 'PROPERTY'
                            ? properties?.[0]?.id || null
                            : brands?.[0]?.id || null,
                      });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="PROPERTY">Single Property</option>
                    <option value="BRAND">Brand-Wide</option>
                    <option value="ORG">Organization-Wide</option>
                  </select>
                </div>
              </div>

              {newUserForm.scopeType !== 'ORG' && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {newUserForm.scopeType === 'PROPERTY' ? 'Property' : 'Brand'} *
                  </label>
                  <select
                    value={newUserForm.scopeId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewUserForm({...newUserForm, scopeId: value ? parseInt(value, 10) : null});
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {(newUserForm.scopeType === 'PROPERTY' ? properties : brands).map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      roleKey: 'STAFF_FRONTDESK',
                      scopeType: defaultScopeType,
                      scopeId: defaultScopeId,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    const trimmedFirst = newUserForm.firstName.trim();
                    const trimmedLast = newUserForm.lastName.trim();
                    const trimmedPhone = newUserForm.phone.trim();

                    if (!trimmedFirst || !trimmedLast || !trimmedPhone) {
                      alert('First name, last name, and phone number are required.');
                      return;
                    }

                    try {
                      const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          firstName: trimmedFirst,
                          lastName: trimmedLast,
                          email: newUserForm.email,
                          phone: trimmedPhone,
                          roleKey: newUserForm.roleKey,
                          scopeType: newUserForm.scopeType,
                          scopeId: newUserForm.scopeType === 'ORG' ? null : newUserForm.scopeId,
                        }),
                      });

                      if (response.ok) {
                        alert('User created successfully!');
                        setNewUserForm({
                          firstName: '',
                          lastName: '',
                          email: '',
                          phone: '',
                          roleKey: 'STAFF_FRONTDESK',
                          scopeType: defaultScopeType,
                          scopeId: defaultScopeId,
                        });
                        setShowAddUserModal(false);
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert('Failed to create user: ' + error.error);
                      }
                    } catch (error) {
                      alert('Error creating user');
                      console.error(error);
                    }
                  }}
                >
                  Create User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {propertyEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm px-4 py-8">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">
                  Edit {propertyForm?.name || 'Property'}
                </h3>
                <p className="text-sm text-neutral-500">
                  Update property information, room types, and base availability.
                </p>
              </div>
              <button
                type="button"
                onClick={closePropertyEditor}
                className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
                disabled={propertyEditorSaving}
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
              {propertyEditorLoading ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  Loading property configuration…
                </div>
              ) : (
                <>
                  {propertyEditorError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {propertyEditorError}
                    </div>
                  )}

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
                        Property Details
                      </h4>
                      <FormField label="Property Name">
                        <Input
                          value={propertyForm?.name ?? ''}
                          onChange={(event) => handlePropertyFormChange('name', event.target.value)}
                        />
                      </FormField>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Phone">
                          <Input
                            value={propertyForm?.phone ?? ''}
                            onChange={(event) => handlePropertyFormChange('phone', event.target.value)}
                          />
                        </FormField>
                        <FormField label="Email">
                          <Input
                            type="email"
                            value={propertyForm?.email ?? ''}
                            onChange={(event) => handlePropertyFormChange('email', event.target.value)}
                          />
                        </FormField>
                        <FormField label="Timezone">
                          <Input
                            value={propertyForm?.timezone ?? 'Asia/Kolkata'}
                            onChange={(event) => handlePropertyFormChange('timezone', event.target.value)}
                          />
                        </FormField>
                        <FormField label="Currency">
                          <Input
                            value={propertyForm?.currency ?? 'INR'}
                            onChange={(event) => handlePropertyFormChange('currency', event.target.value)}
                          />
                        </FormField>
                        <FormField label="Default Buffer (%)">
                          <Input
                            type="number"
                            value={propertyForm?.defaultBuffer ?? '0'}
                            onChange={(event) => handlePropertyFormChange('defaultBuffer', event.target.value)}
                          />
                        </FormField>
                      </div>

                      <label className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                          checked={propertyForm?.overbookingEnabled !== false}
                          onChange={(event) => handlePropertyFormChange('overbookingEnabled', event.target.checked)}
                        />
                        Allow controlled overbooking (respect property buffer)
                      </label>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="City">
                          <Input
                            value={propertyForm?.city ?? ''}
                            onChange={(event) => handlePropertyFormChange('city', event.target.value)}
                          />
                        </FormField>
                        <FormField label="State">
                          <Input
                            value={propertyForm?.state ?? ''}
                            onChange={(event) => handlePropertyFormChange('state', event.target.value)}
                          />
                        </FormField>
                        <FormField label="Postal Code">
                          <Input
                            value={propertyForm?.pincode ?? ''}
                            onChange={(event) => handlePropertyFormChange('pincode', event.target.value)}
                          />
                        </FormField>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Address
                        </label>
                        <textarea
                          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          rows={3}
                          value={propertyForm?.address ?? ''}
                          onChange={(event) => handlePropertyFormChange('address', event.target.value)}
                        />
                      </div>

                      {activePropertyMeta?.property?.defaultBuffer !== undefined && (
                        <div className="rounded-lg bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
                          <span className="font-semibold text-neutral-900">Property Buffer:</span>
                          <span className="ml-2">{activePropertyMeta.property.defaultBuffer}%</span>
                          <span className="ml-3 font-semibold text-neutral-900">Timezone:</span>
                          <span className="ml-2">{activePropertyMeta.property.timezone || 'Asia/Kolkata'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
                        Notes
                      </h4>
                      <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                        Updating property details and room types will regenerate BAR pricing and
                        recalculate inventory buffers for the next 60 days.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
                          Room Types &amp; Base Pods
                        </h4>
                        <p className="text-xs text-neutral-500">
                          Adjust base availability and BAR (Best Available Rate) pricing. Remove a room type to deactivate it.
                        </p>
                      </div>
                      <Button variant="primary" size="sm" onClick={addRoomTypeRow}>
                        Add Room Type
                      </Button>
                    </div>

                    {roomTypeForms.length === 0 ? (
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                        No room types configured yet. Add your first room type to begin syncing availability.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {roomTypeForms.map((roomType, index) => {
                          const key = roomType.id ?? roomType.tempId ?? index;
                          return (
                            <div key={key} className="rounded-xl border border-neutral-200 px-4 py-4 shadow-sm">
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex-1">
                                  <FormField label="Room Type Name">
                                    <Input
                                      value={roomType.name}
                                      onChange={(event) => updateRoomTypeField(index, 'name', event.target.value)}
                                    />
                                  </FormField>
                                </div>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                                      checked={roomType.isActive !== false}
                                      onChange={(event) => updateRoomTypeField(index, 'isActive', event.target.checked)}
                                    />
                                    Active
                                  </label>
                                  <button
                                    type="button"
                                    className="text-xs font-medium text-red-600 hover:text-red-700"
                                    onClick={() => removeRoomTypeRow(index)}
                                    disabled={propertyEditorSaving}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-4 pt-4 md:grid-cols-5">
                                <FormField label="Base Pods">
                                  <Input
                                    type="number"
                                    value={roomType.baseRooms}
                                    onChange={(event) => updateRoomTypeField(index, 'baseRooms', event.target.value)}
                                  />
                                </FormField>
                                <FormField label="Capacity">
                                  <Input
                                    type="number"
                                    value={roomType.capacity}
                                    onChange={(event) => updateRoomTypeField(index, 'capacity', event.target.value)}
                                  />
                                </FormField>
                                <FormField label="BAR Price (INR)">
                                  <Input
                                    type="number"
                                    value={roomType.ratePlanPrice ?? ''}
                                    onChange={(event) => updateRoomTypeField(index, 'ratePlanPrice', event.target.value)}
                                  />
                                </FormField>
                                <FormField label="Sort Order">
                                  <Input
                                    type="number"
                                    value={roomType.sortOrder ?? String(index)}
                                    onChange={(event) => updateRoomTypeField(index, 'sortOrder', event.target.value)}
                                  />
                                </FormField>
                                <FormField label="Code (optional)" optional>
                                  <Input
                                    value={roomType.code ?? ''}
                                    onChange={(event) => updateRoomTypeField(index, 'code', event.target.value)}
                                  />
                                </FormField>
                              </div>

                              <div className="pt-4">
                                <label className="block text-xs font-semibold text-neutral-600 mb-2">
                                  Description
                                </label>
                                <textarea
                                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                  rows={2}
                                  value={roomType.description || ''}
                                  onChange={(event) => updateRoomTypeField(index, 'description', event.target.value)}
                                />
                              </div>

                              {roomType.inventorySummary && (
                                <div className="mt-4 grid gap-3 rounded-lg bg-neutral-50 px-4 py-3 text-xs text-neutral-600 md:grid-cols-3">
                                  <div>
                                    <span className="font-semibold text-neutral-900">{roomType.inventorySummary.totalFreeToSell ?? 0}</span>
                                    <span className="ml-1">free to sell (next window)</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-neutral-900">{roomType.inventorySummary.totalBooked ?? 0}</span>
                                    <span className="ml-1">booked</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-neutral-900">{roomType.inventorySummary.totalHolds ?? 0}</span>
                                    <span className="ml-1">on hold</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between">
              <span>Saving will refresh BAR pricing and re-sync OTA availability automatically.</span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={closePropertyEditor} disabled={propertyEditorSaving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handlePropertyEditorSave} disabled={propertyEditorSaving}>
                  {propertyEditorSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// Server-side data fetching - Using API with better error handling
export async function getServerSideProps() {
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:4000';
  
  try {
    console.log('Fetching admin data from:', API_URL);

            // Fetch all data with proper error handling
            // Note: Bookings API requires authentication, so we skip it in getServerSideProps
            // Bookings will be fetched client-side after authentication
            const [brandsRes, propertiesRes, usersRes] = await Promise.all([
              fetch(`${API_URL}/api/brands`).catch(e => { console.error('Brands fetch failed:', e); return null; }),
              fetch(`${API_URL}/api/properties`).catch(e => { console.error('Properties fetch failed:', e); return null; }),
              fetch(`${API_URL}/api/users`).catch(e => { console.error('Users fetch failed:', e); return null; }),
            ]);

            // Parse responses, handling errors gracefully
            let brands = [];
            let properties = [];
            let bookings = []; // Will be fetched client-side after authentication
            let users = [];

            if (brandsRes && brandsRes.ok) {
              try {
                const brandsData = await brandsRes.json();
                brands = brandsData.brands || brandsData.data || [];
              } catch (e) {
                console.error('Error parsing brands response:', e);
              }
            }

            if (propertiesRes && propertiesRes.ok) {
              try {
                const propertiesData = await propertiesRes.json();
                properties = propertiesData.properties || propertiesData.data || [];
              } catch (e) {
                console.error('Error parsing properties response:', e);
              }
            }

            // Bookings API requires authentication, so we skip it in getServerSideProps
            // Bookings will be fetched client-side in the component after user authentication
            console.log('Bookings will be fetched client-side after authentication');

    if (usersRes && usersRes.ok) {
      try {
        const usersData = await usersRes.json();
        users = usersData.users || usersData.data || [];
      } catch (e) {
        console.error('Error parsing users response:', e);
      }
    }

    const roomTypes: any[] = []; // Room types loaded separately per property

    // Fetch real loyalty accounts from API
    let loyaltyAccounts = [];
    const loyaltyRes = await fetch(`${API_URL}/api/loyalty/accounts`).catch(e => { 
      console.error('Loyalty fetch failed:', e); 
      return null; 
    });
    if (loyaltyRes && loyaltyRes.ok) {
      try {
        const loyaltyData = await loyaltyRes.json();
        loyaltyAccounts = loyaltyData.accounts || loyaltyData.data || [];
      } catch (e) {
        console.error('Error parsing loyalty response:', e);
      }
    }

            console.log('Admin data fetched:', { 
              brands: brands.length, 
              properties: properties.length,
              loyalty: loyaltyAccounts.length,
              users: users.length
            });

            return {
              props: {
                brands,
                properties,
                bookings: [], // Will be fetched client-side after authentication
                users,
                roomTypes: Array.isArray(roomTypes) ? roomTypes : [],
                loyalty: loyaltyAccounts,
                stats: {
                  brands: brands.length,
                  properties: properties.length,
                  bookings: 0, // Will be updated client-side
                  loyalty: loyaltyAccounts.length,
                  users: users.length,
                }
              }
            };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    return {
      props: {
        brands: [],
        properties: [],
        bookings: [],
        users: [],
        roomTypes: [],
        loyalty: [],
        stats: { brands: 0, properties: 0, bookings: 0, loyalty: 0, users: 0 }
      }
    };
  }
}

