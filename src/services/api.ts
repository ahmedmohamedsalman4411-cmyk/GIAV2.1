import { 
  MenuItem, SiteSettings, ReservationSettings, Reservation, 
  AuditLog, AdminUser, MenuCategory, AdminRole, AdminPermission 
} from '../types';
import { localDatabase } from './localDatabase';

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
  // Public Data (with seamless GitHub Pages static fallback)
  async getPublicData(): Promise<PublicDataResponse> {
    try {
      const res = await fetch('/api/public/data');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local storage (for GitHub Pages static hosting)
    }
    return localDatabase.getPublicData();
  },

  async getAvailableSlots(date: string): Promise<AvailableSlotsResponse> {
    try {
      const res = await fetch(`/api/public/available-slots?date=${encodeURIComponent(date)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.getAvailableSlots(date);
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
    try {
      const res = await fetch('/api/public/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.submitReservation(payload);
  },

  // Admin Authentication
  async login(username: string, password: string): Promise<{ success: boolean; user: AdminUser; token: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json().catch(() => null);
      if (data?.error && res.status !== 404) {
        throw new Error(data.error);
      }
    } catch (e: any) {
      if (e?.message && e.message !== 'Failed to fetch') {
        throw e;
      }
    }
    return localDatabase.adminLogin(username, password);
  },

  async changePassword(username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.changePassword(username, currentPassword, newPassword);
  },

  async getAdminData(): Promise<AdminDataResponse> {
    try {
      const res = await fetch('/api/admin/data');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.getAdminData();
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<{ success: boolean; settings: SiteSettings }> {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.updateSettings(settings);
  },

  async updateReservationSettings(rules: Partial<ReservationSettings>): Promise<{ success: boolean; reservationSettings: ReservationSettings }> {
    try {
      const res = await fetch('/api/admin/reservation-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.updateReservationSettings(rules);
  },

  async createMenuItem(item: Partial<MenuItem>): Promise<{ success: boolean; item: MenuItem }> {
    try {
      const res = await fetch('/api/admin/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.createMenuItem(item);
  },

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<{ success: boolean; item: MenuItem }> {
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.updateMenuItem(id, item);
  },

  async deleteMenuItem(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.deleteMenuItem(id);
  },

  // Categories
  async createCategory(cat: { key: string; names: Record<string, string>; sortOrder?: number }): Promise<{ success: boolean; category: MenuCategory }> {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.createCategory(cat);
  },

  async updateCategory(id: string, cat: Partial<MenuCategory>): Promise<{ success: boolean; category: MenuCategory }> {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.updateCategory(id, cat);
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.deleteCategory(id);
  },

  // Reservations
  async updateReservation(id: string, update: Partial<Reservation>): Promise<{ success: boolean; reservation: Reservation }> {
    try {
      const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(update)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.updateReservation(id, update);
  },

  async deleteReservation(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.deleteReservation(id);
  },

  // Dish / Media Image Upload
  async uploadImage(base64Data: string, mimeType: string, filename?: string): Promise<{ success: boolean; imageUrl: string }> {
    try {
      const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ base64Data, mimeType, filename })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    // In static mode, return the data URI directly
    return {
      success: true,
      imageUrl: base64Data.startsWith('data:') ? base64Data : `data:${mimeType};base64,${base64Data}`
    };
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
    try {
      const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.createAdminUser(user);
  },

  async updateAdminUser(id: string, user: {
    role?: AdminRole;
    permissions?: AdminPermission[];
    password?: string;
    mustChangePassword?: boolean;
    isTemporaryPassword?: boolean;
  }): Promise<{ success: boolean; user: AdminUser }> {
    try {
      const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.updateAdminUser(id, user);
  },

  async deleteAdminUser(id: string): Promise<{ success: boolean }> {
    try {
      const token = localStorage.getItem('gia_admin_token') || sessionStorage.getItem('gia_admin_token');
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return localDatabase.deleteAdminUser(id);
  }
};
