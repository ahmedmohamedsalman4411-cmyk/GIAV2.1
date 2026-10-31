/**
 * Client-side offline & static hosting (GitHub Pages) fallback database.
 * Enables 100% of the website features (Public Menu, Table Booking Engine,
 * Admin Authentication, RBAC, and CMS) to run without an active Express backend.
 */

import defaultDb from '../../data/restaurant_db.json';
import { 
  MenuItem, SiteSettings, ReservationSettings, Reservation, 
  AuditLog, AdminUser, MenuCategory, AdminRole, AdminPermission 
} from '../types';

export interface LocalRestaurantDb {
  settings: SiteSettings;
  reservationSettings: ReservationSettings;
  menuItems: MenuItem[];
  categories: MenuCategory[];
  reservations: Reservation[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'gia_restaurant_local_db';

export function getLocalDb(): LocalRestaurantDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.settings && parsed.menuItems) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from localStorage, using initial dataset', e);
  }

  // Clone default initial dataset
  const cloned = JSON.parse(JSON.stringify(defaultDb)) as LocalRestaurantDb;
  saveLocalDb(cloned);
  return cloned;
}

export function saveLocalDb(db: LocalRestaurantDb): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export const localDatabase = {
  getPublicData() {
    const db = getLocalDb();
    const availableItems = db.menuItems
      .filter(item => item.isAvailable)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      settings: db.settings,
      reservationSettings: db.reservationSettings,
      categories: db.categories || [],
      menuItems: availableItems
    };
  },

  getAvailableSlots(dateStr: string) {
    const db = getLocalDb();
    const { blackoutDates, serviceOpeningTime, serviceClosingTime, slotIntervalMinutes, maxCapacityPerSlot } = db.reservationSettings;

    if (blackoutDates.includes(dateStr)) {
      return { date: dateStr, isBlackout: true, slots: [] };
    }

    const [openH, openM] = (serviceOpeningTime || '12:00').split(':').map(Number);
    const [closeH, closeM] = (serviceClosingTime || '23:30').split(':').map(Number);

    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;
    const interval = slotIntervalMinutes || 30;
    const capacity = maxCapacityPerSlot || 24;

    const dayBookings = db.reservations.filter(
      r => r.date === dateStr && r.status !== 'cancelled' && r.status !== 'no-show' && r.status !== 'waitlist'
    );

    const slots = [];
    for (let m = startMinutes; m <= endMinutes; m += interval) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const bookedCount = dayBookings
        .filter(r => r.time === timeStr)
        .reduce((sum, r) => sum + r.guestsCount, 0);

      const availableGuests = Math.max(0, capacity - bookedCount);
      slots.push({
        time: timeStr,
        availableGuests,
        isFull: availableGuests <= 0
      });
    }

    return {
      date: dateStr,
      isBlackout: false,
      slots
    };
  },

  submitReservation(payload: {
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
  }) {
    const db = getLocalDb();
    const ref = 'GIA-' + Math.floor(10000 + Math.random() * 90000);
    const isWaitlist = !!payload.isWaitlist;

    const newRes: Reservation = {
      id: 'res-' + Date.now(),
      bookingRef: ref,
      customerName: payload.customerName.trim(),
      phone: payload.phone.trim(),
      countryCode: payload.countryCode || '+971',
      email: payload.email?.trim(),
      guestsCount: Number(payload.guestsCount),
      date: payload.date,
      time: payload.time,
      occasion: payload.occasion?.trim(),
      specialRequests: payload.specialRequests?.trim(),
      status: isWaitlist ? 'waitlist' : (db.reservationSettings.autoConfirm ? 'confirmed' : 'new'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.reservations.unshift(newRes);
    db.auditLogs.unshift({
      id: 'log-' + Date.now(),
      action: isWaitlist ? 'WAITLIST_RESERVATION' : 'NEW_RESERVATION',
      details: `${isWaitlist ? 'Waitlist' : 'Booking'} ${ref} created for ${payload.customerName} (${payload.guestsCount} guests).`,
      timestamp: new Date().toISOString(),
      performedBy: 'Customer (Static / GitHub Pages)'
    });

    saveLocalDb(db);

    let message = 'تم استلام طلب حجزك بنجاح. سيقوم فريق الاستقبال بمراجعته قريباً.';
    if (isWaitlist) {
      message = 'تم تسجيل طلبك في قائمة الانتظار بنجاح.';
    } else if (newRes.status === 'confirmed') {
      message = 'تم تأكيد حجزك تلقائياً بنجاح!';
    }

    return {
      success: true,
      bookingRef: ref,
      status: newRes.status,
      reservation: newRes,
      message
    };
  },

  adminLogin(username: string, password: string) {
    const db = getLocalDb();
    const user = db.adminUsers.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    // Accept Admin / Admin or matches stored credentials
    const isValid = user && (password === user.password || (user.username === 'Admin' && password === 'Admin'));

    if (!user || !isValid) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const token = 'gia-token-' + Date.now();
    return {
      success: true,
      token,
      user
    };
  },

  changePassword(username: string, currentPw: string, newPw: string) {
    const db = getLocalDb();
    const user = db.adminUsers.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user) throw new Error('المستخدم غير موجود');

    user.password = newPw;
    user.mustChangePassword = false;
    saveLocalDb(db);

    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  },

  getAdminData() {
    return getLocalDb();
  },

  updateSettings(settings: Partial<SiteSettings>) {
    const db = getLocalDb();
    db.settings = { ...db.settings, ...settings, lastUpdated: new Date().toISOString() };
    saveLocalDb(db);
    return { success: true, settings: db.settings };
  },

  updateReservationSettings(rules: Partial<ReservationSettings>) {
    const db = getLocalDb();
    db.reservationSettings = { ...db.reservationSettings, ...rules };
    saveLocalDb(db);
    return { success: true, reservationSettings: db.reservationSettings };
  },

  createMenuItem(item: Partial<MenuItem>) {
    const db = getLocalDb();
    const newItem: MenuItem = {
      id: 'dish-' + Date.now(),
      category: item.category || 'pasta',
      names: item.names || { ar: 'طبق جديد', en: 'New Dish' },
      descriptions: item.descriptions || { ar: '', en: '' },
      price: item.price || 95,
      currency: db.settings.currency || 'AED',
      image: item.image || './images/dish_burrata_pugliese_1793363108448.jpg',
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      isFeatured: !!item.isFeatured,
      dietaryTags: item.dietaryTags || [],
      sortOrder: db.menuItems.length + 1,
      updatedAt: new Date().toISOString()
    };
    db.menuItems.push(newItem);
    saveLocalDb(db);
    return { success: true, item: newItem };
  },

  updateMenuItem(id: string, update: Partial<MenuItem>) {
    const db = getLocalDb();
    const idx = db.menuItems.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Dish not found');
    db.menuItems[idx] = { ...db.menuItems[idx], ...update, updatedAt: new Date().toISOString() };
    saveLocalDb(db);
    return { success: true, item: db.menuItems[idx] };
  },

  deleteMenuItem(id: string) {
    const db = getLocalDb();
    db.menuItems = db.menuItems.filter(i => i.id !== id);
    saveLocalDb(db);
    return { success: true };
  },

  createCategory(cat: { key: string; names: Record<string, string>; sortOrder?: number }) {
    const db = getLocalDb();
    const newCat: MenuCategory = {
      id: 'cat-' + Date.now(),
      key: cat.key,
      names: cat.names,
      sortOrder: cat.sortOrder || db.categories.length + 1
    };
    db.categories.push(newCat);
    saveLocalDb(db);
    return { success: true, category: newCat };
  },

  updateCategory(id: string, cat: Partial<MenuCategory>) {
    const db = getLocalDb();
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    db.categories[idx] = { ...db.categories[idx], ...cat };
    saveLocalDb(db);
    return { success: true, category: db.categories[idx] };
  },

  deleteCategory(id: string) {
    const db = getLocalDb();
    db.categories = db.categories.filter(c => c.id !== id);
    saveLocalDb(db);
    return { success: true };
  },

  updateReservation(id: string, update: Partial<Reservation>) {
    const db = getLocalDb();
    const idx = db.reservations.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Reservation not found');
    db.reservations[idx] = { ...db.reservations[idx], ...update, updatedAt: new Date().toISOString() };
    saveLocalDb(db);
    return { success: true, reservation: db.reservations[idx] };
  },

  deleteReservation(id: string) {
    const db = getLocalDb();
    db.reservations = db.reservations.filter(r => r.id !== id);
    saveLocalDb(db);
    return { success: true, message: 'Reservation deleted' };
  },

  createAdminUser(user: {
    username: string;
    password: string;
    role: AdminRole;
    permissions?: AdminPermission[];
    mustChangePassword?: boolean;
    isTemporaryPassword?: boolean;
  }) {
    const db = getLocalDb();
    const newUser: AdminUser = {
      id: 'admin-' + Date.now(),
      username: user.username,
      password: user.password,
      role: user.role,
      permissions: user.permissions || ['view_overview'],
      createdAt: new Date().toISOString(),
      mustChangePassword: !!user.mustChangePassword,
      isTemporaryPassword: !!user.isTemporaryPassword
    };
    db.adminUsers.push(newUser);
    saveLocalDb(db);
    return { success: true, user: newUser };
  },

  updateAdminUser(id: string, user: {
    role?: AdminRole;
    permissions?: AdminPermission[];
    password?: string;
    mustChangePassword?: boolean;
    isTemporaryPassword?: boolean;
  }) {
    const db = getLocalDb();
    const idx = db.adminUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    db.adminUsers[idx] = { ...db.adminUsers[idx], ...user };
    saveLocalDb(db);
    return { success: true, user: db.adminUsers[idx] };
  },

  deleteAdminUser(id: string) {
    const db = getLocalDb();
    db.adminUsers = db.adminUsers.filter(u => u.id !== id);
    saveLocalDb(db);
    return { success: true };
  }
};
