import { MenuItem, SiteSettings, ReservationSettings, Reservation, AuditLog, AdminUser, MenuCategory, AdminRole, AdminPermission } from '../types';

export interface PublicDataResponse {
  settings: SiteSettings;
  reservationSettings: ReservationSettings;
  menuItems: MenuItem[];
  categories?: MenuCategory[];
}

export interface SlotInfo {
  time: string;
  availableGuests: number;
  isFull: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  isBlackout: boolean;
  slots: SlotInfo[];
}

export interface AdminDataResponse {
  settings: SiteSettings;
  reservationSettings: ReservationSettings;
  menuItems: MenuItem[];
  categories: MenuCategory[];
  reservations: Reservation[];
  auditLogs: AuditLog[];
  adminUsers: AdminUser[];
}

export const api = {
  // Public
  async getPublicData(): Promise<PublicDataResponse> {
    const res = await fetch('/api/public/data');
    if (!res.ok) throw new Error('Failed to fetch public restaurant data');
    return res.json();
  },

  async getAvailableSlots(date: string): Promise<AvailableSlotsResponse> {
    const res = await fetch(`/api/public/available-slots?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error('Failed to fetch available time slots');
    return res.json();
  },

  async submitReservation(payload: {
    customerName: string;
    phone: string;
    countryCode: string;
    email?: string;
    guestsCount: number;
    date: string;
    time: string;
    occasion?: string;
    specialRequests?: string;
    isWaitlist?: boolean;
  }): Promise<{ success: boolean; bookingRef: string; status: string; message: string; reservation: Reservation }> {
    const res = await fetch('/api/public/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit reservation');
    return data;
  },

  // Admin
  async login(username: string, password: string): Promise<{ success: boolean; user: AdminUser; token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async changePassword(username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password update failed');
    return data;
  },

  async getAdminData(): Promise<AdminDataResponse> {
    const res = await fetch('/api/admin/data');
    if (!res.ok) throw new Error('Failed to fetch admin data');
    return res.json();
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<{ success: boolean; settings: SiteSettings }> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data;
  },

  async updateReservationSettings(rules: Partial<ReservationSettings>): Promise<{ success: boolean; reservationSettings: ReservationSettings }> {
    const res = await fetch('/api/admin/reservation-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update reservation rules');
    return data;
  },

  async createMenuItem(item: Partial<MenuItem>): Promise<{ success: boolean; item: MenuItem }> {
    const res = await fetch('/api/admin/menu/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create menu item');
    return data;
  },

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<{ success: boolean; item: MenuItem }> {
    const res = await fetch(`/api/admin/menu/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update menu item');
    return data;
  },

  async deleteMenuItem(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/menu/items/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete menu item');
    return data;
  },

  // Categories
  async createCategory(cat: { key: string; names: Record<string, string>; sortOrder?: number }): Promise<{ success: boolean; category: MenuCategory }> {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create category');
    return data;
  },

  async updateCategory(id: string, cat: Partial<MenuCategory>): Promise<{ success: boolean; category: MenuCategory }> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update category');
    return data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete category');
    return data;
  },

  // Reservations
  async updateReservation(id: string, update: Partial<Reservation>): Promise<{ success: boolean; reservation: Reservation }> {
    const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(update)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update reservation');
    return data;
  },

  async deleteReservation(id: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete reservation');
    return data;
  },

  // Dish / Media Image Upload
  async uploadImage(base64Data: string, mimeType: string, filename?: string): Promise<{ success: boolean; imageUrl: string }> {
    const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ base64Data, mimeType, filename })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload image');
    return data;
  },

  // Admins & Permissions
  async createAdminUser(user: {
    username: string;
    password: string;
    role: AdminRole;
    permissions?: AdminPermission[];
    mustChangePassword?: boolean;
    isTemporaryPassword?: boolean;
  }): Promise<{ success: boolean; user: AdminUser }> {
    const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user');
    return data;
  },

  async updateAdminUser(id: string, user: {
    role?: AdminRole;
    permissions?: AdminPermission[];
    password?: string;
    mustChangePassword?: boolean;
    isTemporaryPassword?: boolean;
  }): Promise<{ success: boolean; user: AdminUser }> {
    const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },

  async deleteAdminUser(id: string): Promise<{ success: boolean }> {
    const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  }
};
