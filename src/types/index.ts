export interface MenuItem {
  id: string;
  category: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  price: number;
  currency: string;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  dietaryTags: string[];
  sortOrder: number;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'whatsapp' | 'phone' | 'facebook' | 'tiktok' | 'twitter' | 'youtube' | 'maps' | 'other';
  label: string;
  url: string;
  isActive: boolean;
}

export interface SiteSettings {
  restaurantName: string;
  restaurantNameAr: string;
  logoText: string;
  logoUrl?: string;
  faviconUrl?: string;
  currency: string;
  tagline: Record<string, string>;
  aboutText: Record<string, string>;
  address: string;
  addressAr: string;
  googleMapsUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  emergencyPhone: string;
  openingHoursWeekdays: string;
  openingHoursWeekends: string;
  openingHoursWeekdaysAr: string;
  openingHoursWeekendsAr: string;
  instagramUrl: string;
  heroImage: string;
  lastUpdated: string;
  // Comprehensive SEO Settings
  seoTitle?: string;
  seoTitleAr?: string;
  seoDescription?: string;
  seoDescriptionAr?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  // Dynamic Social Media Links
  socialLinks?: SocialLink[];
}

export interface ReservationSettings {
  serviceOpeningTime: string;
  serviceClosingTime: string;
  slotIntervalMinutes: number;
  maxGuestsPerParty: number;
  maxCapacityPerSlot: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  autoConfirm: boolean;
  blackoutDates: string[];
  instructions: Record<string, string>;
}

export interface Reservation {
  id: string;
  bookingRef: string;
  customerName: string;
  phone: string;
  countryCode: string;
  email?: string;
  guestsCount: number;
  date: string;
  time: string;
  occasion?: string;
  specialRequests?: string;
  status: 'new' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'waitlist';
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  key: string;
  names: Record<string, string>;
  sortOrder: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  performedBy: string;
  ipAddress?: string;
}

export type AdminRole = 'superadmin' | 'reservations_manager' | 'menu_manager' | 'content_editor' | 'custom';

export type AdminPermission =
  | 'view_overview'
  | 'view_reservations'
  | 'manage_reservations'
  | 'manage_reservation_rules'
  | 'view_menu'
  | 'manage_menu'
  | 'edit_prices'
  | 'manage_categories'
  | 'edit_content'
  | 'manage_translations'
  | 'manage_contact'
  | 'manage_seo'
  | 'manage_currency'
  | 'view_logs'
  | 'manage_admins';

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
  mustChangePassword?: boolean;
  isTemporaryPassword?: boolean;
}

