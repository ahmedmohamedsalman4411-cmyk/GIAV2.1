import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Lock, User, LogOut, Plus, Edit2, Trash2, CheckCircle, 
  XCircle, Clock, Calendar, Download, Eye, AlertTriangle, Settings, 
  Utensils, BookOpen, Key, RefreshCw, FileText, Search, Save, X, EyeOff,
  LayoutDashboard, Tag, Sliders, Globe, MapPin, Users, History,
  Check, ArrowRight, ArrowLeft, Filter, Phone, Sparkles, AlertCircle,
  ExternalLink, ChevronRight, Info, Upload, Image as ImageIcon, Link2
} from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS, LANGUAGES } from '../i18n/translations';
import { 
  MenuItem, SiteSettings, ReservationSettings, Reservation, AuditLog, 
  AdminUser, MenuCategory, AdminRole, AdminPermission, SocialLink 
} from '../types';
import { api, AdminDataResponse } from '../services/api';

interface AdminPanelProps {
  currentLang: SupportedLanguage;
  onClose: () => void;
  onRefreshPublicData: () => void;
}

type AdminSection = 
  | 'overview'
  | 'menu'
  | 'categories'
  | 'reservations'
  | 'res_rules'
  | 'site_content'
  | 'languages'
  | 'location_contact'
  | 'admins_rbac'
  | 'audit_logs'
  | 'account_settings';

const ALL_POSSIBLE_PERMISSIONS: { key: AdminPermission; labelAr: string; labelEn: string }[] = [
  { key: 'view_overview', labelAr: 'عرض لوحة المعلومات (نظرة عامة)', labelEn: 'View Overview KPI Dashboard' },
  { key: 'view_reservations', labelAr: 'استعراض الحجوزات وقائمة الانتظار', labelEn: 'View Reservations & Waitlist' },
  { key: 'manage_reservations', labelAr: 'إدارة وتعديل وحذف حالات الحجوزات', labelEn: 'Manage & Delete Reservation Statuses' },
  { key: 'manage_reservation_rules', labelAr: 'تعديل سياسات وساعات الحجز والتواريخ المغلقة', labelEn: 'Manage Booking Policies & Hours' },
  { key: 'view_menu', labelAr: 'عرض قائمة الأطباق', labelEn: 'View Menu Items' },
  { key: 'manage_menu', labelAr: 'إضافة وتعديل وحذف أطباق القائمة ورفع الصور', labelEn: 'Add, Edit, Delete Dishes & Images' },
  { key: 'edit_prices', labelAr: 'تعديل أسعار الأطباق', labelEn: 'Edit Dish Prices' },
  { key: 'manage_categories', labelAr: 'إدارة تصنيفات القائمة وترتيبها', labelEn: 'Manage Menu Categories' },
  { key: 'edit_content', labelAr: 'تعديل نصوص وقصة وهوية الموقع', labelEn: 'Edit Site Content & Story' },
  { key: 'manage_translations', labelAr: 'استعراض وإدارة اللغات والترجمات', labelEn: 'Manage Translations' },
  { key: 'manage_contact', labelAr: 'تعديل بيانات الموقع وروابط التواصل', labelEn: 'Manage Contact & Social Links' },
  { key: 'manage_seo', labelAr: 'إدارة إعدادات محركات البحث والـ SEO والشعار', labelEn: 'Manage SEO Meta & Favicon' },
  { key: 'manage_currency', labelAr: 'تغيير عملة الموقع (مقصور على المشرف الأعلى)', labelEn: 'Change Site Currency (SuperAdmin Only)' },
  { key: 'view_logs', labelAr: 'الاطلاع على سجل النشاط والتدقيق الأمني', labelEn: 'View Security Audit Logs' },
  { key: 'manage_admins', labelAr: 'إدارة المشرفين والصلاحيات وإنشاء الحسابات', labelEn: 'Manage Admin Accounts & RBAC' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentLang,
  onClose,
  onRefreshPublicData
}) => {
  const isRtl = currentLang === 'ar';

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('gia_admin_token'));
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('gia_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form state (strictly initialized empty so credentials must be entered explicitly)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Forced password change modal
  const [mustChangePw, setMustChangePw] = useState(false);
  const [currPw, setCurrPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Active section among the 11 requested sections
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Admin Data from Server
  const [loadingData, setLoadingData] = useState(false);
  const [adminData, setAdminData] = useState<AdminDataResponse | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Section 2 (Menu) filters & editing
  const [menuFilterCat, setMenuFilterCat] = useState('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<MenuItem> | null>(null);
  const [dishImgMode, setDishImgMode] = useState<'upload' | 'url'>('upload');
  const [uploadingDishImg, setUploadingDishImg] = useState(false);
  const [dishImgError, setDishImgError] = useState<string | null>(null);

  // Section 3 (Categories) editing
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<MenuCategory> | null>(null);

  // Section 4 (Reservations) filters, search & deletion
  const [resSearch, setResSearch] = useState('');
  const [resStatusFilter, setResStatusFilter] = useState<string>('all');
  const [resDateFilter, setResDateFilter] = useState<string>('');
  const [resQuickDate, setResQuickDate] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [editingResNotes, setEditingResNotes] = useState<{ id: string; notes: string } | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [deletingResLoading, setDeletingResLoading] = useState(false);

  // Section 5 (Rules) form state
  const [rulesForm, setRulesForm] = useState<ReservationSettings | null>(null);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  // Section 6 & 8 (Content, SEO & Social) form state
  const [contentForm, setContentForm] = useState<SiteSettings | null>(null);

  // Section 8 (Location & Contact) form state
  const [contactForm, setContactForm] = useState<SiteSettings | null>(null);

  // Section 9 (Admins & RBAC) modal & form
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [targetUser, setTargetUser] = useState<Partial<AdminUser> & { password?: string }>({
    username: '',
    password: '',
    role: 'reservations_manager',
    permissions: []
  });

  // Section 10 (Audit Logs) filter
  const [logSearch, setLogSearch] = useState('');

  // Load admin data on authentication
  const loadAdminData = async () => {
    setLoadingData(true);
    setActionError(null);
    try {
      const data = await api.getAdminData();
      setAdminData(data);
      setRulesForm(data.reservationSettings);
      setContentForm(data.settings);
      setContactForm(data.settings);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load admin data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadAdminData();
    }
  }, [authToken]);

  // Flash message clear
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Handle ESC key to close modal if unauthenticated or viewing panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Permission Check Helper
  const hasPermission = (permission: AdminPermission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    return currentUser.permissions?.includes(permission) ?? false;
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await api.login(loginUsername, loginPassword);
      if (res.success) {
        setAuthToken(res.token);
        setCurrentUser(res.user);
        localStorage.setItem('gia_admin_token', res.token);
        localStorage.setItem('gia_admin_user', JSON.stringify(res.user));

        // Direct user to corresponding section based on role
        if (res.user.role === 'superadmin') {
          setActiveSection('overview');
        } else if (res.user.role === 'reservations_manager') {
          setActiveSection('reservations');
        } else if (res.user.role === 'menu_manager') {
          setActiveSection('menu');
        } else if (res.user.role === 'content_editor') {
          setActiveSection('site_content');
        } else if (res.user.permissions?.includes('view_reservations')) {
          setActiveSection('reservations');
        } else if (res.user.permissions?.includes('view_menu')) {
          setActiveSection('menu');
        } else {
          setActiveSection('overview');
        }

        if (res.user.mustChangePassword) {
          setMustChangePw(true);
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'بيانات الدخول غير صحيحة، يرجى المحاولة ثانية');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('gia_admin_token');
    localStorage.removeItem('gia_admin_user');
    onClose();
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPw !== confirmPw) {
      setPwError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPw === 'Admin') {
      setPwError('لا يمكن إعادة استخدام كلمة المرور الافتراضية');
      return;
    }

    try {
      await api.changePassword(currentUser?.username || 'Admin', currPw, newPw);
      setPwSuccess('تم تحديث كلمة المرور بنجاح');
      setMustChangePw(false);
      if (currentUser) {
        const updated = { ...currentUser, mustChangePassword: false, isTemporaryPassword: false };
        setCurrentUser(updated);
        localStorage.setItem('gia_admin_user', JSON.stringify(updated));
      }
      setCurrPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      setPwError(err.message || 'فشل تحديث كلمة المرور');
    }
  };

  // Filtered reservations for Section 4 (computed unconditionally before any early returns)
  const filteredReservations = useMemo(() => {
    if (!adminData) return [];
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const weekEndDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    return adminData.reservations.filter(r => {
      // Status filter
      if (resStatusFilter !== 'all' && r.status !== resStatusFilter) return false;

      // Quick Date filter
      if (resQuickDate === 'today' && r.date !== today) return false;
      if (resQuickDate === 'tomorrow' && r.date !== tomorrowDate) return false;
      if (resQuickDate === 'week' && (r.date < today || r.date > weekEndDate)) return false;

      // Custom Exact Date filter
      if (resDateFilter && r.date !== resDateFilter) return false;

      // Search query across ref, name, phone, and email
      if (resSearch.trim()) {
        const q = resSearch.trim().toLowerCase();
        const matchRef = r.bookingRef.toLowerCase().includes(q);
        const matchName = r.customerName.toLowerCase().includes(q);
        const matchPhone = r.phone.includes(q);
        const matchEmail = (r.email || '').toLowerCase().includes(q);
        if (!matchRef && !matchName && !matchPhone && !matchEmail) return false;
      }
      return true;
    });
  }, [adminData, resStatusFilter, resDateFilter, resQuickDate, resSearch]);

  // Filtered dishes for Section 2 (computed unconditionally before any early returns)
  const filteredDishes = useMemo(() => {
    if (!adminData) return [];
    return adminData.menuItems.filter(item => {
      if (menuFilterCat !== 'all' && item.category !== menuFilterCat) return false;
      if (menuSearch.trim()) {
        const q = menuSearch.trim().toLowerCase();
        const nameAr = (item.names?.ar || '').toLowerCase();
        const nameEn = (item.names?.en || '').toLowerCase();
        if (!nameAr.includes(q) && !nameEn.includes(q)) return false;
      }
      return true;
    });
  }, [adminData, menuFilterCat, menuSearch]);

  // -------------------------------------------------------------
  // RENDER: LOGIN FORM (If not authenticated)
  // -------------------------------------------------------------
  if (!authToken || !currentUser) {
    return (
      <div
        className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="relative w-full max-w-md bg-[#faf8f5] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button with high z-index and explicit click handling */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-30 p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#283618]"
            aria-label={currentLang === 'ar' ? 'إغلاق والعودة للموقع' : 'Close and return to site'}
            title={currentLang === 'ar' ? 'إغلاق والعودة للموقع' : 'Close and return to site'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-[#283618] text-[#dda15e] flex items-center justify-center mx-auto mb-3 shadow-md font-serif text-2xl font-bold">
              G
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              {currentLang === 'ar' ? 'بوابة إدارة مطعم جيا دبي' : 'GIA Dubai Management Portal'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {currentLang === 'ar' ? 'تسجيل دخول المشرفين المعتمدين عبر الرابط الآمن' : 'Authorized Personnel Sign-in'}
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {currentLang === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute right-3 rtl:right-auto rtl:left-3 top-3" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Admin"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {currentLang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute right-3 rtl:right-auto rtl:left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#283618]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#283618] hover:bg-[#1c2711] disabled:bg-stone-400 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loginLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4 text-[#dda15e]" />
                  <span>{currentLang === 'ar' ? 'دخول لوحة التحكم' : 'Authenticate & Enter'}</span>
                </>
              )}
            </button>

            {/* Clear explicit Cancel & Return to Website button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-200/80"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{currentLang === 'ar' ? 'إلغاء والعودة للموقع الرئيسي' : 'Cancel & Return to Website'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-200 text-center text-[11px] text-stone-500">
            {currentLang === 'ar'
              ? 'تشفير آمن للجلسة · مطعم جيا دبي مول'
              : 'Secure Session · GIA Restaurant Dubai Mall'}
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 11-SECTION SIDEBAR DEFINITIONS (Arabic First)
  // -------------------------------------------------------------
  const sidebarItems: { id: AdminSection; titleAr: string; titleEn: string; icon: React.ReactNode; permission?: AdminPermission }[] = [
    { id: 'overview', titleAr: '١. نظرة عامة', titleEn: '1. Overview KPIs', icon: <LayoutDashboard className="w-4 h-4" />, permission: 'view_overview' },
    { id: 'menu', titleAr: '٢. المنتجات والقائمة', titleEn: '2. Dishes & Menu', icon: <Utensils className="w-4 h-4" />, permission: 'view_menu' },
    { id: 'categories', titleAr: '٣. التصنيفات', titleEn: '3. Categories', icon: <Tag className="w-4 h-4" />, permission: 'manage_categories' },
    { id: 'reservations', titleAr: '٤. الحجوزات', titleEn: '4. Reservations', icon: <Calendar className="w-4 h-4" />, permission: 'view_reservations' },
    { id: 'res_rules', titleAr: '٥. إعدادات الحجوزات', titleEn: '5. Booking Rules', icon: <Sliders className="w-4 h-4" />, permission: 'manage_reservation_rules' },
    { id: 'site_content', titleAr: '٦. محتوى الموقع', titleEn: '6. Site Content', icon: <BookOpen className="w-4 h-4" />, permission: 'edit_content' },
    { id: 'languages', titleAr: '٧. اللغات والترجمات', titleEn: '7. Languages', icon: <Globe className="w-4 h-4" />, permission: 'manage_translations' },
    { id: 'location_contact', titleAr: '٨. الموقع وبيانات التواصل', titleEn: '8. Location & Contact', icon: <MapPin className="w-4 h-4" />, permission: 'manage_contact' },
    { id: 'admins_rbac', titleAr: '٩. المشرفون والصلاحيات', titleEn: '9. Admins & RBAC', icon: <Users className="w-4 h-4" />, permission: 'manage_admins' },
    { id: 'audit_logs', titleAr: '١٠. سجل النشاط', titleEn: '10. Audit Logs', icon: <History className="w-4 h-4" />, permission: 'view_logs' },
    { id: 'account_settings', titleAr: '١١. إعدادات الحساب والخروج', titleEn: '11. Account & Logout', icon: <Settings className="w-4 h-4" /> }
  ];

  // Helper metrics for Section 1 (Overview)
  const todayStr = new Date().toISOString().split('T')[0];
  const totalReservations = adminData?.reservations.length || 0;
  const todayReservations = adminData?.reservations.filter(r => r.date === todayStr) || [];
  const pendingReservations = adminData?.reservations.filter(r => r.status === 'pending' || r.status === 'new') || [];
  const waitlistReservations = adminData?.reservations.filter(r => r.status === 'waitlist') || [];
  const totalCoversToday = todayReservations.reduce((sum, r) => sum + r.guestsCount, 0);
  const activeDishesCount = adminData?.menuItems.filter(i => i.isAvailable).length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f1ea] text-stone-900 flex flex-col overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-16 bg-[#283618] text-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#dda15e] font-serif font-bold text-lg">
            G
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight">
              {currentLang === 'ar' ? 'لوحة تحكم المشرف — مطعم GIA دبي' : 'GIA Restaurant Admin Dashboard'}
            </h1>
            <p className="text-[10px] text-stone-300">
              {currentLang === 'ar' ? 'نظام إدارة المحتوى والحجوزات والصلاحيات' : 'RBAC Management & Operations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <User className="w-3.5 h-3.5 text-[#dda15e]" />
            <span className="font-semibold">{currentUser.username}</span>
            <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              {currentUser.role}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{currentLang === 'ar' ? 'العودة للموقع' : 'Visit Website'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Area: 11-Section Arabic RTL Sidebar + Content View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Arabic RTL Sidebar */}
        <aside className="w-64 sm:w-72 bg-white border-l rtl:border-l-0 rtl:border-r border-stone-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-stone-100">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
              {currentLang === 'ar' ? 'الأقسام الإدارية الـ 11' : '11 Admin Sections'}
            </span>
          </div>

          <nav className="p-2 space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const isActive = activeSection === item.id;
              const allowed = !item.permission || hasPermission(item.permission);

              return (
                <button
                  key={item.id}
                  disabled={!allowed}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-right rtl:text-right ${
                    !allowed
                      ? 'text-stone-300 bg-stone-50 cursor-not-allowed opacity-60'
                      : isActive
                      ? 'bg-[#283618] text-white shadow-xs font-bold'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#dda15e]' : 'text-stone-500'}>
                      {item.icon}
                    </span>
                    <span>{currentLang === 'ar' ? item.titleAr : item.titleEn}</span>
                  </div>

                  {!allowed && (
                    <Lock className="w-3 h-3 text-stone-300" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-3 bg-stone-50 border-t border-stone-200 text-[10px] text-stone-500 flex items-center justify-between">
            <span>GIA Version 2.4.0</span>
            <span className="text-emerald-700 font-bold">● Database Online</span>
          </div>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#faf8f5]">
          
          {/* Flash Feedback Alert */}
          {actionSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center gap-2 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* SECTION 1: OVERVIEW & KPIS */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    {currentLang === 'ar' ? 'نظرة عامة ومؤشرات الأداء' : 'Overview & Operations KPI'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {currentLang === 'ar' ? 'متابعة حية لحالة الحجوزات والنشاط اليومي في مطعم جيا' : 'Live metrics for restaurant service'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/api/admin/reservations/export-csv"
                    className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#283618]" />
                    <span>{currentLang === 'ar' ? 'تصدير الحجوزات CSV' : 'Export CSV'}</span>
                  </a>

                  <button
                    onClick={() => {
                      setEditingDish({
                        names: { ar: '', en: '' },
                        descriptions: { ar: '', en: '' },
                        price: 95,
                        category: 'pasta',
                        isAvailable: true,
                        isFeatured: false,
                        dietaryTags: ['fresh-pasta']
                      });
                      setIsDishModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#dda15e]" />
                    <span>{currentLang === 'ar' ? 'إضافة طبق جديد' : 'New Dish'}</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                    {currentLang === 'ar' ? 'حجوزات اليوم' : "Today's Bookings"}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-serif text-3xl font-bold text-[#283618] tabular-nums">
                      {todayReservations.length}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({totalCoversToday} {currentLang === 'ar' ? 'ضيف' : 'covers'})
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                    {currentLang === 'ar' ? 'طلبات بانتظار التأكيد' : 'Pending Confirmation'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-serif text-3xl font-bold text-[#bc6c25] tabular-nums">
                      {pendingReservations.length}
                    </span>
                    <span className="text-xs text-stone-400">
                      {currentLang === 'ar' ? 'تحتاج إجراء' : 'action needed'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                    {currentLang === 'ar' ? 'قائمة الانتظار (Waitlist)' : 'Active Waitlist'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-serif text-3xl font-bold text-stone-800 tabular-nums">
                      {waitlistReservations.length}
                    </span>
                    <span className="text-xs text-stone-400">
                      {currentLang === 'ar' ? 'طلب مسجل' : 'guests waiting'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                    {currentLang === 'ar' ? 'أطباق القائمة الجاهزة' : 'Active Dishes'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-serif text-3xl font-bold text-stone-900 tabular-nums">
                      {activeDishesCount}
                    </span>
                    <span className="text-xs text-stone-400">
                      / {adminData?.menuItems.length || 0}
                    </span>
                  </div>
                </div>

              </div>

              {/* Today's Schedule Overview */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    {currentLang === 'ar' ? 'جدول حجوزات اليوم' : "Today's Guest Schedule"}
                  </h3>
                  <button
                    onClick={() => setActiveSection('reservations')}
                    className="text-xs font-semibold text-[#283618] hover:underline"
                  >
                    {currentLang === 'ar' ? 'عرض كافة الحجوزات ←' : 'View all bookings →'}
                  </button>
                </div>

                {todayReservations.length === 0 ? (
                  <div className="text-center py-8 text-xs text-stone-400">
                    {currentLang === 'ar' ? 'لا توجد حجوزات مسجلة لهذا اليوم حتى الآن.' : 'No reservations scheduled for today.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="p-3">الرقم المرجعي</th>
                          <th className="p-3">اسم الضيف</th>
                          <th className="p-3">الوقت</th>
                          <th className="p-3">الضيوف</th>
                          <th className="p-3">الهاتف</th>
                          <th className="p-3">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {todayReservations.map(r => (
                          <tr key={r.id} className="hover:bg-stone-50">
                            <td className="p-3 font-mono font-bold text-[#283618]">{r.bookingRef}</td>
                            <td className="p-3 font-semibold text-stone-900">{r.customerName}</td>
                            <td className="p-3 tabular-nums font-bold">{r.time}</td>
                            <td className="p-3 tabular-nums">{r.guestsCount}</td>
                            <td className="p-3 dir-ltr font-mono">{r.countryCode} {r.phone}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                r.status === 'pending' || r.status === 'new' ? 'bg-amber-100 text-amber-800' :
                                r.status === 'waitlist' ? 'bg-purple-100 text-purple-800' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SECTION 2: PRODUCTS & MENU MANAGEMENT */}
          {activeSection === 'menu' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    {currentLang === 'ar' ? 'إدارة المنتجات وقائمة الطعام' : 'Menu & Dishes Management'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {currentLang === 'ar' ? 'إضافة وتعديل الأطباق، الأسعار بالدرهم الإماراتي، وتحديد حالة التوفر' : 'Manage dishes, AED prices, and stock availability'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingDish({
                      names: { ar: '', en: '' },
                      descriptions: { ar: '', en: '' },
                      price: 95,
                      category: 'pasta',
                      isAvailable: true,
                      isFeatured: false,
                      dietaryTags: ['fresh-pasta']
                    });
                    setIsDishModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#dda15e]" />
                  <span>{currentLang === 'ar' ? 'إضافة طبق جديد للقائمة' : 'Add New Dish'}</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder={currentLang === 'ar' ? 'ابحث بالاسم العربي أو الإنجليزي...' : 'Search dish name...'}
                    className="w-full text-xs text-stone-900 bg-transparent focus:outline-none"
                  />
                  {menuSearch && (
                    <button onClick={() => setMenuSearch('')} className="text-stone-400 text-xs">✕</button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">{currentLang === 'ar' ? 'التصنيف:' : 'Category:'}</span>
                  <select
                    value={menuFilterCat}
                    onChange={(e) => setMenuFilterCat(e.target.value)}
                    className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none"
                  >
                    <option value="all">{currentLang === 'ar' ? 'كافة التصنيفات' : 'All Categories'}</option>
                    {adminData?.categories.map(c => (
                      <option key={c.key} value={c.key}>
                        {c.names[currentLang] || c.names['ar'] || c.names['en'] || c.key}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDishes.map(dish => (
                  <div key={dish.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative h-40 bg-stone-100 overflow-hidden">
                        <img src={dish.image} alt={dish.names?.en || ''} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {dish.isFeatured && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dda15e] text-[#283618] shadow-xs">
                              {currentLang === 'ar' ? 'مميز' : 'Featured'}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                            dish.isAvailable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {dish.isAvailable ? (currentLang === 'ar' ? 'متوفر' : 'In Stock') : (currentLang === 'ar' ? 'نفد' : 'Sold Out')}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                          {dish.category}
                        </span>
                        <h4 className="font-serif text-base font-bold text-stone-900">
                          {dish.names?.ar || dish.names?.en}
                        </h4>
                        <div className="text-xs text-stone-500 font-sans">
                          {dish.names?.en}
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                          {dish.descriptions?.ar || dish.descriptions?.en}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between mt-2">
                      <span className="font-serif text-lg font-bold text-stone-900 tabular-nums">
                        {dish.price} <span className="text-xs font-sans text-stone-500">AED</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          title="Toggle Availability"
                          onClick={async () => {
                            try {
                              await api.updateMenuItem(dish.id, { isAvailable: !dish.isAvailable });
                              setActionSuccess(`تم تحديث حالة توفر طبق ${dish.names?.ar || dish.names?.en}`);
                              loadAdminData();
                              onRefreshPublicData();
                            } catch (e: any) {
                              setActionError(e.message);
                            }
                          }}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                            dish.isAvailable
                              ? 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {dish.isAvailable ? 'تعطيل' : 'تفعيل'}
                        </button>

                        <button
                          onClick={() => {
                            setEditingDish(dish);
                            setIsDishModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm(`هل أنت متأكد من حذف طبق "${dish.names?.ar || dish.names?.en}"؟`)) {
                              try {
                                await api.deleteMenuItem(dish.id);
                                setActionSuccess('تم حذف الطبق بنجاح');
                                loadAdminData();
                                onRefreshPublicData();
                              } catch (e: any) {
                                setActionError(e.message);
                              }
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* SECTION 3: CATEGORIES MANAGEMENT */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    {currentLang === 'ar' ? 'إدارة تصنيفات قائمة الطعام' : 'Menu Categories'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {currentLang === 'ar' ? 'إضافة وتعديل التصنيفات وترتيب ظهورها في القائمة' : 'Organize food & beverage categories'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCat({ key: '', names: { ar: '', en: '', it: '' }, sortOrder: (adminData?.categories.length || 0) + 1 });
                    setIsCatModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#dda15e]" />
                  <span>{currentLang === 'ar' ? 'إضافة تصنيف جديد' : 'New Category'}</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-3">الترتيب</th>
                      <th className="p-3">المفتاح (Key)</th>
                      <th className="p-3">الاسم بالعربية</th>
                      <th className="p-3">الاسم بالإنجليزية</th>
                      <th className="p-3">الأطباق التابعة</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {adminData?.categories.map((cat) => {
                      const dishesInCat = adminData.menuItems.filter(i => i.category === cat.key).length;
                      return (
                        <tr key={cat.id} className="hover:bg-stone-50">
                          <td className="p-3 tabular-nums font-bold text-stone-700">{cat.sortOrder}</td>
                          <td className="p-3 font-mono text-stone-500">{cat.key}</td>
                          <td className="p-3 font-semibold text-stone-900">{cat.names?.ar || '—'}</td>
                          <td className="p-3 text-stone-700">{cat.names?.en || '—'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                              {dishesInCat} أطباق
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingCat(cat);
                                  setIsCatModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`هل أنت متأكد من حذف تصنيف "${cat.names?.ar || cat.key}"؟`)) {
                                    try {
                                      await api.deleteCategory(cat.id);
                                      setActionSuccess('تم حذف التصنيف بنجاح');
                                      loadAdminData();
                                      onRefreshPublicData();
                                    } catch (e: any) {
                                      setActionError(e.message);
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* SECTION 4: RESERVATIONS MANAGEMENT */}
          {activeSection === 'reservations' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    {currentLang === 'ar' ? 'إدارة حجوزات الطاولات' : 'Table Reservations'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {currentLang === 'ar' ? 'استعراض وتأكيد وإلغاء وتعديل طلبات الحجز وقائمة الانتظار' : 'Manage guest bookings, status updates, and staff notes'}
                  </p>
                </div>

                <a
                  href="/api/admin/reservations/export-csv"
                  className="px-4 py-2 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#dda15e]" />
                  <span>{currentLang === 'ar' ? 'تصدير الحجوزات كملف CSV' : 'Export Reservations CSV'}</span>
                </a>
              </div>

              {/* Filters & Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
                    <Search className="w-4 h-4 text-stone-400 shrink-0" />
                    <input
                      type="text"
                      value={resSearch}
                      onChange={(e) => setResSearch(e.target.value)}
                      placeholder={currentLang === 'ar' ? 'بحث باسم الضيف، رقم الهاتف، الرمز المرجعي أو البريد...' : 'Search by guest name, phone, ref, or email...'}
                      className="w-full text-xs text-stone-900 bg-transparent focus:outline-none"
                    />
                    {resSearch && (
                      <button onClick={() => setResSearch('')} className="text-stone-400 hover:text-stone-700 text-xs">✕</button>
                    )}
                  </div>

                  {/* Result Count Badge */}
                  <div className="text-xs font-semibold px-3 py-1.5 bg-[#283618]/10 text-[#283618] rounded-xl border border-[#283618]/20 flex items-center gap-1.5">
                    <span>{currentLang === 'ar' ? 'عرض' : 'Showing'}</span>
                    <strong className="tabular-nums font-bold text-stone-900">{filteredReservations.length}</strong>
                    <span>{currentLang === 'ar' ? `من أصل ${adminData?.reservations.length || 0} حجزاً` : `of ${adminData?.reservations.length || 0} bookings`}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-stone-100">
                  {/* Quick Date Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-stone-400 ml-1">تصفية التاريخ:</span>
                    {[
                      { id: 'all', label: 'كافة التواريخ' },
                      { id: 'today', label: 'اليوم' },
                      { id: 'tomorrow', label: 'غداً' },
                      { id: 'week', label: 'هذا الأسبوع' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setResQuickDate(tab.id as any);
                          setResDateFilter('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          resQuickDate === tab.id && !resDateFilter
                            ? 'bg-[#283618] text-white shadow-xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}

                    <div className="flex items-center gap-1 text-xs text-stone-500 mr-2">
                      <input
                        type="date"
                        value={resDateFilter}
                        onChange={(e) => {
                          setResDateFilter(e.target.value);
                          setResQuickDate('all');
                        }}
                        className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                      />
                      {resDateFilter && (
                        <button onClick={() => setResDateFilter('')} className="text-xs text-stone-400 hover:text-stone-700 font-bold">✕</button>
                      )}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span>الحالة:</span>
                    <select
                      value={resStatusFilter}
                      onChange={(e) => setResStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 cursor-pointer"
                    >
                      <option value="all">كافة الحالات ({adminData?.reservations.length || 0})</option>
                      <option value="new">جديد (New)</option>
                      <option value="pending">قيد التأكيد (Pending)</option>
                      <option value="confirmed">مؤكد (Confirmed)</option>
                      <option value="waitlist">قائمة الانتظار (Waitlist)</option>
                      <option value="completed">مكتمل (Completed)</option>
                      <option value="cancelled">ملغي (Cancelled)</option>
                      <option value="no-show">لم يحضر (No-Show)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reservations Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-12 text-xs text-stone-400">
                    لا توجد حجوزات مطابقة للفلاتر المحددة.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="p-3">الرقم المرجعي</th>
                          <th className="p-3">اسم الضيف</th>
                          <th className="p-3">التاريخ والوقت</th>
                          <th className="p-3">الضيوف</th>
                          <th className="p-3">الهاتف</th>
                          <th className="p-3">الحالة الحالية</th>
                          <th className="p-3">ملاحظات وطلبات خاصة</th>
                          <th className="p-3 text-center">إجراءات المضيف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredReservations.map(res => (
                          <tr key={res.id} className="hover:bg-stone-50">
                            <td className="p-3 font-mono font-bold text-[#283618] whitespace-nowrap">
                              {res.bookingRef}
                            </td>
                            <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">
                              {res.customerName}
                              {res.occasion && (
                                <span className="block text-[10px] text-[#bc6c25] font-normal">
                                  مناسبة: {res.occasion}
                                </span>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap tabular-nums">
                              <span className="font-semibold block">{res.date}</span>
                              <span className="text-stone-500 text-[11px]">{res.time}</span>
                            </td>
                            <td className="p-3 tabular-nums font-bold">
                              {res.guestsCount}
                            </td>
                            <td className="p-3 dir-ltr font-mono whitespace-nowrap">
                              <a
                                href={`https://wa.me/${res.countryCode.replace('+', '')}${res.phone.replace(/\s+/g, '')}?text=مرحباً%20${encodeURIComponent(res.customerName)}،%20بخصوص%20حجزكم%20في%20مطعم%20جيا%20دبي%20برقم%20${res.bookingRef}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:underline"
                              >
                                {res.countryCode} {res.phone}
                              </a>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                res.status === 'pending' || res.status === 'new' ? 'bg-amber-100 text-amber-800' :
                                res.status === 'waitlist' ? 'bg-purple-100 text-purple-800' :
                                res.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                res.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'
                              }`}>
                                {res.status}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs text-[11px] text-stone-600">
                              {res.specialRequests && (
                                <p className="italic text-stone-800 mb-1">"{res.specialRequests}"</p>
                              )}
                              {editingResNotes?.id === res.id ? (
                                <div className="space-y-1">
                                  <textarea
                                    rows={2}
                                    value={editingResNotes.notes}
                                    onChange={(e) => setEditingResNotes({ id: res.id, notes: e.target.value })}
                                    className="w-full p-1.5 border border-stone-300 rounded text-xs"
                                  />
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      onClick={() => setEditingResNotes(null)}
                                      className="px-2 py-0.5 bg-stone-200 rounded text-[10px]"
                                    >
                                      إلغاء
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await api.updateReservation(res.id, { internalNotes: editingResNotes.notes });
                                          setEditingResNotes(null);
                                          setActionSuccess('تم حفظ ملاحظات الطاقم');
                                          loadAdminData();
                                        } catch (e: any) {
                                          setActionError(e.message);
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-[#283618] text-white rounded text-[10px]"
                                    >
                                      حفظ
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => setEditingResNotes({ id: res.id, notes: res.internalNotes || '' })}
                                  className="cursor-pointer hover:bg-stone-100 p-1 rounded text-stone-400 hover:text-stone-700"
                                >
                                  {res.internalNotes ? (
                                    <span className="text-stone-800 font-medium">ملاحظات: {res.internalNotes}</span>
                                  ) : (
                                    <span>+ إضافة ملاحظة داخلية لطاقم الاستقبال</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <select
                                  value={res.status}
                                  onChange={async (e) => {
                                    try {
                                      await api.updateReservation(res.id, { status: e.target.value as any });
                                      setActionSuccess(`تم تحديث حالة الحجز ${res.bookingRef} إلى ${e.target.value}`);
                                      loadAdminData();
                                    } catch (err: any) {
                                      setActionError(err.message);
                                    }
                                  }}
                                  className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 cursor-pointer"
                                >
                                  <option value="new">جديد (New)</option>
                                  <option value="pending">قيد التأكيد (Pending)</option>
                                  <option value="confirmed">تأكيد الحجز (Confirm)</option>
                                  <option value="waitlist">قائمة الانتظار (Waitlist)</option>
                                  <option value="completed">تم الحضور (Completed)</option>
                                  <option value="cancelled">ملغي (Cancelled)</option>
                                  <option value="no-show">لم يحضر (No-Show)</option>
                                </select>

                                {/* Delete button for cancelled, completed, or no-show bookings */}
                                {(res.status === 'cancelled' || res.status === 'completed' || res.status === 'no-show') && (
                                  <button
                                    onClick={() => setReservationToDelete(res)}
                                    title="حذف الحجز الملغي أو المنتهي نهائياً"
                                    className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Confirmation Modal: Delete Cancelled / Finished Reservation */}
              {reservationToDelete && (
                <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 text-rose-600">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-stone-900">
                          تأكيد حذف الحجز نهائياً
                        </h3>
                        <p className="text-xs text-stone-500">
                          الرمز المرجعي: <span className="font-mono font-bold text-stone-800">{reservationToDelete.bookingRef}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700 space-y-1.5 border border-stone-200">
                      <p>• <strong>الضيف:</strong> {reservationToDelete.customerName} ({reservationToDelete.guestsCount} ضيوف)</p>
                      <p>• <strong>الموعد:</strong> {reservationToDelete.date} الساعة {reservationToDelete.time}</p>
                      <p>• <strong>الحالة الحالية:</strong> <span className="font-semibold text-rose-700">{reservationToDelete.status}</span></p>
                      <p className="text-rose-700 text-[11px] pt-1 border-t border-stone-200">
                        تنبيه: سيتم حذف هذا السجل بشكل نهائي من قاعدة البيانات وتسجيل تفاصيل العملية في سجل التدقيق الأمني.
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
                      <button
                        onClick={() => setReservationToDelete(null)}
                        disabled={deletingResLoading}
                        className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={async () => {
                          setDeletingResLoading(true);
                          try {
                            await api.deleteReservation(reservationToDelete.id);
                            setActionSuccess(`تم حذف الحجز ${reservationToDelete.bookingRef} نهائياً.`);
                            setReservationToDelete(null);
                            loadAdminData();
                          } catch (err: any) {
                            setActionError(err.message || 'فشل حذف الحجز');
                          } finally {
                            setDeletingResLoading(false);
                          }
                        }}
                        disabled={deletingResLoading}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {deletingResLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>نعم، حذف الحجز الآن</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* SECTION 5: RESERVATION SETTINGS & RULES */}
          {activeSection === 'res_rules' && rulesForm && (
            <div className="space-y-6 max-w-3xl">
              
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  {currentLang === 'ar' ? 'إعدادات وقواعد الحجوزات' : 'Reservation Rules & Hours'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {currentLang === 'ar' ? 'تحديد ساعات تقديم الخدمة، الفترات الزمنية، السعة الاستيعابية، والتواريخ المغلقة' : 'Configure time intervals, capacity, and blackout dates'}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      وقت بدء الخدمة (Dubai Time)
                    </label>
                    <input
                      type="time"
                      value={rulesForm.serviceOpeningTime}
                      onChange={(e) => setRulesForm({ ...rulesForm, serviceOpeningTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      وقت انتهاء الخدمة (Dubai Time)
                    </label>
                    <input
                      type="time"
                      value={rulesForm.serviceClosingTime}
                      onChange={(e) => setRulesForm({ ...rulesForm, serviceClosingTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      الفترة الزمنية بين المواعيد (بالدقائق)
                    </label>
                    <select
                      value={rulesForm.slotIntervalMinutes}
                      onChange={(e) => setRulesForm({ ...rulesForm, slotIntervalMinutes: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value={15}>15 دقيقة</option>
                      <option value={30}>30 دقيقة (موصى به)</option>
                      <option value={45}>45 دقيقة</option>
                      <option value={60}>60 دقيقة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      أقصى سعة مقاعد لكل موعد (Covers per slot)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={rulesForm.maxCapacityPerSlot}
                      onChange={(e) => setRulesForm({ ...rulesForm, maxCapacityPerSlot: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      أقصى عدد ضيوف للمجموعة الواحدة
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={rulesForm.maxGuestsPerParty}
                      onChange={(e) => setRulesForm({ ...rulesForm, maxGuestsPerParty: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      أقصى مدة للحجز المسبق (بالأيام)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={rulesForm.maxAdvanceDays}
                      onChange={(e) => setRulesForm({ ...rulesForm, maxAdvanceDays: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Auto Confirm Toggle */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-900 text-xs block">
                      التأكيد التلقائي الفوري للحجوزات (Auto Confirm)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      إذا تم تفعيله، يتم تأكيد الحجز فورياً دون الحاجة لمراجعة المضيف يدوياً
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rulesForm.autoConfirm}
                    onChange={(e) => setRulesForm({ ...rulesForm, autoConfirm: e.target.checked })}
                    className="w-5 h-5 accent-[#283618]"
                  />
                </div>

                {/* Blackout Dates */}
                <div className="pt-3 border-t border-stone-100">
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    التواريخ المغلقة للحجوزات (مناسبات خاصة أو صيانة)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={newBlackoutDate}
                      onChange={(e) => setNewBlackoutDate(e.target.value)}
                      className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newBlackoutDate && !rulesForm.blackoutDates.includes(newBlackoutDate)) {
                          setRulesForm({
                            ...rulesForm,
                            blackoutDates: [...rulesForm.blackoutDates, newBlackoutDate]
                          });
                          setNewBlackoutDate('');
                        }
                      }}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold"
                    >
                      + إضافة تاريخ مغلق
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {rulesForm.blackoutDates.map(date => (
                      <span key={date} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-1.5">
                        <span>{date}</span>
                        <button
                          onClick={() => {
                            setRulesForm({
                              ...rulesForm,
                              blackoutDates: rulesForm.blackoutDates.filter(d => d !== date)
                            });
                          }}
                          className="hover:text-rose-950 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Save CTA */}
                <div className="pt-4 border-t border-stone-100">
                  <button
                    onClick={async () => {
                      try {
                        await api.updateReservationSettings(rulesForm);
                        setActionSuccess('تم حفظ إعدادات وقواعد الحجز بنجاح');
                        loadAdminData();
                        onRefreshPublicData();
                      } catch (e: any) {
                        setActionError(e.message);
                      }
                    }}
                    className="px-6 py-2.5 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#dda15e]" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 6: SITE CONTENT & BRANDING */}
          {activeSection === 'site_content' && contentForm && (
            <div className="space-y-6 max-w-3xl">
              
              <div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-stone-900">
                      {currentLang === 'ar' ? 'محتوى وهوية الموقع والـ SEO والعملة' : 'Site Content, SEO & Currency'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {currentLang === 'ar' ? 'تعديل الهوية، العملة، قصة المطعم، وإعدادات محركات البحث والـ Favicon' : 'Branding, site currency, SEO meta, and favicon preview'}
                    </p>
                  </div>

                  {/* SuperAdmin Currency Selector Pill */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-700">عملة الموقع:</span>
                    {currentUser?.role === 'superadmin' ? (
                      <select
                        value={contentForm.currency || 'AED'}
                        onChange={(e) => setContentForm({ ...contentForm, currency: e.target.value })}
                        className="px-2.5 py-1 bg-white border border-[#283618] rounded-xl text-xs font-bold text-[#283618] cursor-pointer"
                      >
                        <option value="AED">AED - درهم إماراتي</option>
                        <option value="USD">USD - دولار أمريكي</option>
                        <option value="EUR">EUR - يورو أوروبي</option>
                        <option value="SAR">SAR - ريال سعودي</option>
                        <option value="QAR">QAR - ريال قطري</option>
                        <option value="KWD">KWD - دينار كويتي</option>
                        <option value="GBP">GBP - جنيه إسترليني</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-stone-800 px-2 py-0.5 bg-stone-200 rounded-md">
                          {contentForm.currency || 'AED'}
                        </span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>المشرف الأعلى فقط</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-xs">
                
                {/* General Branding */}
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#dda15e]" />
                    <span>الهوية والنصوص التعريفية</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        اسم المطعم بالعربية
                      </label>
                      <input
                        type="text"
                        value={contentForm.restaurantNameAr}
                        onChange={(e) => setContentForm({ ...contentForm, restaurantNameAr: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        اسم المطعم بالإنجليزية
                      </label>
                      <input
                        type="text"
                        value={contentForm.restaurantName}
                        onChange={(e) => setContentForm({ ...contentForm, restaurantName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      الشعار النصي (Logo Text)
                    </label>
                    <input
                      type="text"
                      value={contentForm.logoText}
                      onChange={(e) => setContentForm({ ...contentForm, logoText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      العنوان الرئيسي (العربية)
                    </label>
                    <input
                      type="text"
                      value={contentForm.tagline?.ar || ''}
                      onChange={(e) => setContentForm({
                        ...contentForm,
                        tagline: { ...contentForm.tagline, ar: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      العنوان الرئيسي (الإنجليزية)
                    </label>
                    <input
                      type="text"
                      value={contentForm.tagline?.en || ''}
                      onChange={(e) => setContentForm({
                        ...contentForm,
                        tagline: { ...contentForm.tagline, en: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      قصة المطعم والحرفية (بالعربية)
                    </label>
                    <textarea
                      rows={3}
                      value={contentForm.aboutText?.ar || ''}
                      onChange={(e) => setContentForm({
                        ...contentForm,
                        aboutText: { ...contentForm.aboutText, ar: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Favicon & Logo with Live Browser Tab Preview */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#283618]" />
                    <span>أيقونة الموقع (Favicon) وشعار المطعم مع المعاينة الحية</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        رابط أيقونة الموقع (Favicon URL)
                      </label>
                      <input
                        type="text"
                        value={contentForm.faviconUrl || '/favicon.svg'}
                        onChange={(e) => setContentForm({ ...contentForm, faviconUrl: e.target.value })}
                        placeholder="/favicon.svg"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        صيغ مدعومة: SVG (نصية موصى بها) أو PNG 32x32
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        رابط صورة الواجهة الرئيسية (Hero Image URL)
                      </label>
                      <input
                        type="text"
                        value={contentForm.heroImage || ''}
                        onChange={(e) => setContentForm({ ...contentForm, heroImage: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Browser Tab Simulation Preview */}
                  <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200 space-y-2">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                      معاينة مظهر علامة تبويب المتصفح (Browser Tab Live Preview):
                    </span>
                    <div className="max-w-xs bg-white rounded-t-xl border border-stone-300 px-3 py-2 flex items-center gap-2 shadow-xs">
                      <img
                        src={contentForm.faviconUrl || '/favicon.svg'}
                        alt="Favicon preview"
                        className="w-4 h-4 rounded-xs shrink-0 bg-stone-100"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/favicon.svg'; }}
                      />
                      <span className="text-xs font-medium text-stone-800 truncate flex-1">
                        {contentForm.seoTitleAr || 'مطعم جيا دبي | GIA Dubai'}
                      </span>
                      <span className="text-[10px] text-stone-400">✕</span>
                    </div>
                  </div>
                </div>

                {/* Comprehensive SEO Section */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-700" />
                      <span>إعدادات تحسين محركات البحث (SEO & Open Graph)</span>
                    </h3>

                    {/* Quick Test Links */}
                    <div className="flex items-center gap-2">
                      <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-mono text-stone-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>robots.txt</span>
                      </a>
                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-mono text-stone-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>sitemap.xml</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        عنوان صفحة البحث (SEO Title بالعربية)
                      </label>
                      <input
                        type="text"
                        value={contentForm.seoTitleAr || ''}
                        onChange={(e) => setContentForm({ ...contentForm, seoTitleAr: e.target.value })}
                        placeholder="مطعم جيا دبي | المطبخ الإيطالي المعاصر في دبي مول"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        عنوان صفحة البحث (SEO Title بالإنجليزية)
                      </label>
                      <input
                        type="text"
                        value={contentForm.seoTitle || ''}
                        onChange={(e) => setContentForm({ ...contentForm, seoTitle: e.target.value })}
                        placeholder="GIA Restaurant Dubai | Contemporary Italian Dining"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        الوصف التعريفي (Meta Description بالعربية)
                      </label>
                      <textarea
                        rows={2}
                        value={contentForm.seoDescriptionAr || ''}
                        onChange={(e) => setContentForm({ ...contentForm, seoDescriptionAr: e.target.value })}
                        placeholder="مطعم إيطالي راقٍ في فاشن أفينيو بدبي مول..."
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        الوصف التعريفي (Meta Description بالإنجليزية)
                      </label>
                      <textarea
                        rows={2}
                        value={contentForm.seoDescription || ''}
                        onChange={(e) => setContentForm({ ...contentForm, seoDescription: e.target.value })}
                        placeholder="Authentic Italian restaurant at Fashion Avenue, The Dubai Mall..."
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        الرابط الأساسي المعتمد (Canonical URL)
                      </label>
                      <input
                        type="text"
                        value={contentForm.canonicalUrl || 'https://gia-dubai.ae'}
                        onChange={(e) => setContentForm({ ...contentForm, canonicalUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        الكلمات المفتاحية (Meta Keywords)
                      </label>
                      <input
                        type="text"
                        value={contentForm.keywords || ''}
                        onChange={(e) => setContentForm({ ...contentForm, keywords: e.target.value })}
                        placeholder="GIA Dubai, مطعم جيا, مطاعم دبي مول, Italian Restaurant"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      صورة مشاركة الروابط في منصات التواصل (OpenGraph Image)
                    </label>
                    <input
                      type="text"
                      value={contentForm.ogImageUrl || ''}
                      onChange={(e) => setContentForm({ ...contentForm, ogImageUrl: e.target.value })}
                      placeholder="/src/assets/images/hero_gia_dining_1793363107745.jpg"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Save CTA */}
                <div className="pt-4 border-t border-stone-100">
                  <button
                    onClick={async () => {
                      try {
                        await api.updateSettings(contentForm);
                        setActionSuccess('تم حفظ محتوى وهوية وإعدادات الـ SEO والعملة بنجاح');
                        loadAdminData();
                        onRefreshPublicData();
                      } catch (e: any) {
                        setActionError(e.message);
                      }
                    }}
                    className="px-6 py-2.5 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#dda15e]" />
                    <span>حفظ كافة إعدادات الهوية والـ SEO والعملة</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 7: LANGUAGES & TRANSLATIONS */}
          {activeSection === 'languages' && (
            <div className="space-y-6">
              
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  {currentLang === 'ar' ? 'اللغات والترجمات المدعومة' : 'Supported Languages & Localizations'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {currentLang === 'ar' ? 'يدعم موقع مطعم جيا 11 لغة عالمية كاملة مع دعم RTL للغة العربية' : '11 Global Languages with native RTL/LTR switching'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {LANGUAGES.map(lang => (
                  <div key={lang.code} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-stone-900">{lang.name}</h4>
                        <span className="text-[10px] text-stone-500 font-mono">
                          Code: {lang.code} · {lang.dir.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                      نشط 100%
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* SECTION 8: LOCATION & CONTACT (STRICTLY NO EMAIL) */}
          {activeSection === 'location_contact' && contactForm && (
            <div className="space-y-6 max-w-3xl">
              
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  {currentLang === 'ar' ? 'الموقع وبيانات التواصل المباشر' : 'Location & Direct Contact'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {currentLang === 'ar' ? 'إدارة أرقام الهاتف والواتساب ورابط خرائط Google (تم حذف البريد الإلكتروني تماماً بناء على طلبكم)' : 'Phone, WhatsApp, and Google Maps direct links (strictly no email)'}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      رقم الهاتف المباشر للمطعم
                    </label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+971 4 330 8899"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      رقم الواتساب لحجوزات الكونسييرج
                    </label>
                    <input
                      type="text"
                      value={contactForm.whatsapp}
                      onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                      placeholder="+971 50 123 4567"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      هاتف الطوارئ والاستفسارات العاجلة
                    </label>
                    <input
                      type="text"
                      value={contactForm.emergencyPhone}
                      onChange={(e) => setContactForm({ ...contactForm, emergencyPhone: e.target.value })}
                      placeholder="+971 4 330 8890"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      رابط حساب الإنستغرام
                    </label>
                    <input
                      type="text"
                      value={contactForm.instagramUrl}
                      onChange={(e) => setContactForm({ ...contactForm, instagramUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono dir-ltr text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    رابط خرائط Google المباشر (Google Maps Direct Navigation)
                  </label>
                  <input
                    type="text"
                    value={contactForm.googleMapsUrl}
                    onChange={(e) => setContactForm({ ...contactForm, googleMapsUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono dir-ltr text-right"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      العنوان المطبوع بالعربية
                    </label>
                    <input
                      type="text"
                      value={contactForm.addressAr}
                      onChange={(e) => setContactForm({ ...contactForm, addressAr: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      العنوان بالإنجليزية
                    </label>
                    <input
                      type="text"
                      value={contactForm.address}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-sans"
                    />
                  </div>
                </div>

                {/* Dynamic Social Media Channels (Add, Edit, Remove) */}
                <div className="pt-4 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Link2 className="w-4 h-4 text-[#283618]" />
                        <span>وسائل وقنوات التواصل الاجتماعي (إضافة وتعديل وحذف ديناميكي)</span>
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        أضف أو عدّل أو احذف قنوات التواصل للمطعم مثل الإنستغرام، الواتساب، الهاتف، تيك توك، فيسبوك وغيرها.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const current = contactForm.socialLinks || [];
                        const newSoc: SocialLink = {
                          id: 'soc-' + Date.now(),
                          platform: 'instagram',
                          label: 'حساب رسمي جديد',
                          url: '',
                          isActive: true
                        };
                        setContactForm({
                          ...contactForm,
                          socialLinks: [...current, newSoc]
                        });
                      }}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-[#283618] hover:text-white text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة وسيلة تواصل</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(!contactForm.socialLinks || contactForm.socialLinks.length === 0) ? (
                      <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                        لا توجد قنوات تواصل مضافة حالياً. انقر على «إضافة وسيلة تواصل» لإضافة أول قناة.
                      </div>
                    ) : (
                      contactForm.socialLinks.map((soc, idx) => (
                        <div
                          key={soc.id || idx}
                          className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-3"
                        >
                          <div className="w-32 shrink-0">
                            <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">المنصة</label>
                            <select
                              value={soc.platform}
                              onChange={(e) => {
                                const updated = [...(contactForm.socialLinks || [])];
                                updated[idx] = { ...soc, platform: e.target.value as any };
                                setContactForm({ ...contactForm, socialLinks: updated });
                              }}
                              className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              <option value="instagram">Instagram</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="phone">Phone (هاتف)</option>
                              <option value="facebook">Facebook</option>
                              <option value="tiktok">TikTok</option>
                              <option value="twitter">X (Twitter)</option>
                              <option value="youtube">YouTube</option>
                              <option value="maps">Google Maps</option>
                              <option value="other">أخرى</option>
                            </select>
                          </div>

                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">اسم وسيلة التواصل</label>
                            <input
                              type="text"
                              value={soc.label}
                              onChange={(e) => {
                                const updated = [...(contactForm.socialLinks || [])];
                                updated[idx] = { ...soc, label: e.target.value };
                                setContactForm({ ...contactForm, socialLinks: updated });
                              }}
                              placeholder="مثال: إنستغرام جيا الرسمي"
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium"
                            />
                          </div>

                          <div className="flex-[2] min-w-[200px]">
                            <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">الرابط المباشر</label>
                            <input
                              type="text"
                              value={soc.url}
                              onChange={(e) => {
                                const updated = [...(contactForm.socialLinks || [])];
                                updated[idx] = { ...soc, url: e.target.value };
                                setContactForm({ ...contactForm, socialLinks: updated });
                              }}
                              placeholder="https://... أو tel:... أو https://wa.me/..."
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono dir-ltr text-right"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-3 sm:pt-0">
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={soc.isActive !== false}
                                onChange={(e) => {
                                  const updated = [...(contactForm.socialLinks || [])];
                                  updated[idx] = { ...soc, isActive: e.target.checked };
                                  setContactForm({ ...contactForm, socialLinks: updated });
                                }}
                                className="accent-[#283618]"
                              />
                              <span>مفعّل</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = (contactForm.socialLinks || []).filter((_, i) => i !== idx);
                                setContactForm({ ...contactForm, socialLinks: updated });
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              title="حذف هذه القناة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <button
                    onClick={async () => {
                      try {
                        await api.updateSettings(contactForm);
                        setActionSuccess('تم حفظ بيانات الموقع والتواصل وقنوات التواصل الاجتماعي بنجاح');
                        loadAdminData();
                        onRefreshPublicData();
                      } catch (e: any) {
                        setActionError(e.message);
                      }
                    }}
                    className="px-6 py-2.5 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#dda15e]" />
                    <span>حفظ بيانات وقنوات التواصل</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 9: ADMINS & RBAC PERMISSIONS */}
          {activeSection === 'admins_rbac' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    {currentLang === 'ar' ? 'إدارة المشرفين والأدوار والصلاحيات (RBAC)' : 'Admins & RBAC Permissions'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {currentLang === 'ar' ? 'تحديد الصلاحيات الدقيقة وحماية المشرف الرئيسي وإنشاء كلمات مرور مؤقتة' : 'Role-based access control and admin security management'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setUserModalMode('create');
                    setTargetUser({
                      username: '',
                      password: '',
                      role: 'reservations_manager',
                      permissions: ['view_overview', 'view_reservations', 'manage_reservations', 'manage_reservation_rules']
                    });
                    setIsUserModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#dda15e]" />
                  <span>{currentLang === 'ar' ? 'إضافة حساب مشرف جديد' : 'Create Admin Account'}</span>
                </button>
              </div>

              {/* Roles explanation card */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block">
                  الأدوار والصلاحيات المتاحة في النظام:
                </span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  • <strong>Super Admin</strong>: صلاحيات كاملة غير مقيدة لكافة الأقسام الـ 11 وإدارة المشرفين.<br />
                  • <strong>Reservations Manager</strong>: إدارة الحجوزات، التأكيد، الإلغاء، وتعديل سياسات وساعات الحجز.<br />
                  • <strong>Menu Manager</strong>: إدارة الأطباق، التوفر، أسعار الوجبات بالدرهم، وإدارة التصنيفات.<br />
                  • <strong>Content Editor</strong>: تعديل قصة وهوية الموقع، اللغات، وبيانات التواصل والخرائط.<br />
                  • <strong>Custom Role</strong>: صلاحيات مخصصة يحددها المشرف الرئيسي يدوياً لكل مستخدم.
                </p>
              </div>

              {/* Admin Accounts Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-3">اسم المستخدم</th>
                      <th className="p-3">الدور (Role)</th>
                      <th className="p-3">عدد الصلاحيات الممنوحة</th>
                      <th className="p-3">تاريخ الإنشاء</th>
                      <th className="p-3">آخر تسجيل دخول</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {adminData?.adminUsers.map(user => {
                      const isSelf = user.username.toLowerCase() === currentUser.username.toLowerCase();
                      const isSuper = user.role === 'superadmin';
                      return (
                        <tr key={user.id} className="hover:bg-stone-50">
                          <td className="p-3 font-semibold text-stone-900 flex items-center gap-2">
                            <span>{user.username}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 bg-stone-200 text-stone-700 text-[10px] rounded">
                                (حسابك الحالي)
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              user.role === 'superadmin' ? 'bg-[#283618] text-[#dda15e]' :
                              user.role === 'reservations_manager' ? 'bg-amber-100 text-amber-800' :
                              user.role === 'menu_manager' ? 'bg-emerald-100 text-emerald-800' :
                              user.role === 'content_editor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3 tabular-nums font-semibold text-stone-700">
                            {user.role === 'superadmin' ? 'كافة الصلاحيات (13)' : `${user.permissions?.length || 0} من 13`}
                          </td>
                          <td className="p-3 text-stone-500 tabular-nums">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-stone-500 tabular-nums">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'لم يسجل دخول بعد'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setUserModalMode('edit');
                                  setTargetUser({
                                    id: user.id,
                                    username: user.username,
                                    role: user.role,
                                    permissions: user.permissions || [],
                                    isTemporaryPassword: false
                                  });
                                  setIsUserModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                                title="Edit Role & Permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={async () => {
                                  if (confirm(`هل أنت متأكد من حذف حساب المشرف "${user.username}"؟`)) {
                                    try {
                                      await api.deleteAdminUser(user.id);
                                      setActionSuccess(`تم حذف حساب المشرف ${user.username}`);
                                      loadAdminData();
                                    } catch (e: any) {
                                      setActionError(e.message);
                                    }
                                  }
                                }}
                                disabled={isSuper && (adminData?.adminUsers.filter(u => u.role === 'superadmin').length || 0) <= 1}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Delete Admin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* SECTION 10: AUDIT LOGS */}
          {activeSection === 'audit_logs' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    {currentLang === 'ar' ? 'سجل النشاط والتدقيق الأمني' : 'System Audit & Activity Logs'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {currentLang === 'ar' ? 'سجل زمني غير قابل للتعديل لكافة الإجراءات والتعديلات والحجوزات' : 'Tamper-evident activity logs for administrative actions'}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                  <Search className="w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="تصفية السجل..."
                    className="bg-transparent focus:outline-none"
                  />
                  {logSearch && <button onClick={() => setLogSearch('')}>✕</button>}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-3">الوقت والتاريخ</th>
                      <th className="p-3">المُنفّذ</th>
                      <th className="p-3">نوع الإجراء</th>
                      <th className="p-3">تفاصيل النشاط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(adminData?.auditLogs || [])
                      .filter(l => !logSearch || l.details.toLowerCase().includes(logSearch.toLowerCase()) || l.action.toLowerCase().includes(logSearch.toLowerCase()))
                      .map(log => (
                        <tr key={log.id} className="hover:bg-stone-50">
                          <td className="p-3 text-stone-500 tabular-nums whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 font-semibold text-stone-800 whitespace-nowrap">
                            {log.performedBy}
                          </td>
                          <td className="p-3 font-mono text-[11px] font-bold text-[#283618] whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="p-3 text-stone-700">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* SECTION 11: ACCOUNT SETTINGS & LOGOUT */}
          {activeSection === 'account_settings' && (
            <div className="space-y-6 max-w-xl">
              
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  {currentLang === 'ar' ? 'إعدادات الحساب وتسجيل الخروج' : 'Account Settings & Security'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {currentLang === 'ar' ? 'تحديث كلمة المرور الشخصية ومراجعة بيانات الصلاحيات' : 'Change credentials and session control'}
                </p>
              </div>

              {/* Profile Card */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#283618] text-[#dda15e] flex items-center justify-center font-bold text-lg font-serif">
                    {currentUser.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900">{currentUser.username}</h3>
                    <span className="px-2 py-0.5 bg-[#283618] text-[#dda15e] text-[10px] font-bold rounded uppercase">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-stone-600 pt-2 border-t border-stone-100 space-y-1">
                  <div><strong>معرّف الحساب:</strong> <span className="font-mono text-stone-500">{currentUser.id}</span></div>
                  <div><strong>تاريخ الإنشاء:</strong> <span className="tabular-nums text-stone-500">{new Date(currentUser.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#283618]" />
                  <span>تغيير كلمة المرور الخاصة بحسابك</span>
                </h3>

                {pwError && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                    {pwSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      كلمة المرور الحالية
                    </label>
                    <input
                      type="password"
                      required
                      value={currPw}
                      onChange={(e) => setCurrPw(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      required
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="على الأقل 6 خانات..."
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#283618] hover:bg-[#1c2711] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    تحديث كلمة المرور
                  </button>
                </form>
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-700" />
                  <span>تسجيل الخروج من البوابة وإنهاء الجلسة</span>
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT DISH */}
      {/* ------------------------------------------------------------- */}
      {isDishModalOpen && editingDish && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingDish.id ? 'تعديل طبق في القائمة' : 'إضافة طبق جديد'}
              </h3>
              <button onClick={() => setIsDishModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={editingDish.names?.ar || ''}
                  onChange={(e) => setEditingDish({
                    ...editingDish,
                    names: { ...editingDish.names, ar: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">الاسم بالإنجليزية *</label>
                <input
                  type="text"
                  required
                  value={editingDish.names?.en || ''}
                  onChange={(e) => setEditingDish({
                    ...editingDish,
                    names: { ...editingDish.names, en: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">التصنيف</label>
                  <select
                    value={editingDish.category}
                    onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    {adminData?.categories.map(c => (
                      <option key={c.key} value={c.key}>{c.names['ar'] || c.key}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">السعر (AED) *</label>
                  <input
                    type="number"
                    min={1}
                    value={editingDish.price}
                    onChange={(e) => setEditingDish({ ...editingDish, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">الوصف بالعربية</label>
                <textarea
                  rows={2}
                  value={editingDish.descriptions?.ar || ''}
                  onChange={(e) => setEditingDish({
                    ...editingDish,
                    descriptions: { ...editingDish.descriptions, ar: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              {/* Dish Image Management: Upload or URL with Preview */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-stone-700">
                    صورة الطبق (صورة واحدة كحد أقصى)
                  </label>
                  <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDishImgMode('upload')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        dishImgMode === 'upload' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      رفع من الجهاز
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishImgMode('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        dishImgMode === 'url' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      رابط خارجي
                    </button>
                  </div>
                </div>

                {dishImgError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{dishImgError}</span>
                  </div>
                )}

                {/* Upload from device */}
                {dishImgMode === 'upload' && (
                  <div className="space-y-1.5">
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-stone-200 hover:border-[#283618] rounded-2xl cursor-pointer bg-stone-50/60 hover:bg-stone-50 transition-colors">
                      <Upload className="w-5 h-5 text-stone-400 mb-1" />
                      <span className="text-[11px] font-medium text-stone-700">
                        {uploadingDishImg ? 'جارٍ رفع الصورة...' : 'انقر لاختيار صورة من جهازك'}
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        صيغ مدعومة: JPG, PNG, WEBP, AVIF (حد أقصى 5 ميجابايت)
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={uploadingDishImg}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setDishImgError(null);

                          const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
                          if (!allowed.includes(file.type)) {
                            setDishImgError('نوع الملف غير صالح. يرجى اختيار ملف JPG أو PNG أو WEBP أو AVIF.');
                            return;
                          }

                          if (file.size > 5 * 1024 * 1024) {
                            setDishImgError('حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت).');
                            return;
                          }

                          setUploadingDishImg(true);
                          try {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = reader.result as string;
                              const res = await api.uploadImage(base64, file.type, file.name);
                              if (res.success && res.imageUrl) {
                                setEditingDish(prev => prev ? { ...prev, image: res.imageUrl } : prev);
                              }
                              setUploadingDishImg(false);
                            };
                            reader.onerror = () => {
                              setDishImgError('تعذر قراءة ملف الصورة من جهازك.');
                              setUploadingDishImg(false);
                            };
                            reader.readAsDataURL(file);
                          } catch (err: any) {
                            setDishImgError(err.message || 'فشل رفع الصورة');
                            setUploadingDishImg(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Direct URL input */}
                {dishImgMode === 'url' && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Link2 className="w-4 h-4 text-stone-400 absolute right-3 rtl:right-auto rtl:left-3 top-2.5" />
                      <input
                        type="text"
                        value={editingDish.image || ''}
                        onChange={(e) => {
                          setDishImgError(null);
                          setEditingDish({ ...editingDish, image: e.target.value });
                        }}
                        placeholder="https://images.unsplash.com/... أو /src/assets/..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {/* Real-time Image Preview & Action Controls */}
                {editingDish.image && (
                  <div className="p-2.5 bg-stone-100 rounded-2xl flex items-center justify-between gap-3 border border-stone-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={editingDish.image}
                        alt="Dish preview"
                        className="w-12 h-12 object-cover rounded-xl bg-white border border-stone-200 shrink-0"
                        onError={() => setDishImgError('رابط الصورة غير صالح أو لا يمكن تحميله.')}
                      />
                      <div className="min-w-0 text-[11px]">
                        <span className="font-semibold text-stone-800 block truncate">معاينة الصورة الحالية</span>
                        <span className="text-[10px] text-emerald-700 font-medium">✓ جاهزة للعرض في الموقع</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingDish({ ...editingDish, image: '' });
                        setDishImgError(null);
                      }}
                      className="px-2.5 py-1 text-rose-700 hover:bg-rose-100/70 border border-rose-200 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      حذف الصورة
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isAvailable !== false}
                    onChange={(e) => setEditingDish({ ...editingDish, isAvailable: e.target.checked })}
                    className="accent-[#283618]"
                  />
                  <span>متوفر للطلب في المطعم</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingDish.isFeatured}
                    onChange={(e) => setEditingDish({ ...editingDish, isFeatured: e.target.checked })}
                    className="accent-[#283618]"
                  />
                  <span>تمييز في الصفحة الرئيسية</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  try {
                    if (editingDish.id) {
                      await api.updateMenuItem(editingDish.id, editingDish);
                      setActionSuccess('تم تحديث بيانات الطبق بنجاح');
                    } else {
                      await api.createMenuItem(editingDish);
                      setActionSuccess('تمت إضافة الطبق الجديد بنجاح');
                    }
                    setIsDishModalOpen(false);
                    loadAdminData();
                    onRefreshPublicData();
                  } catch (e: any) {
                    setActionError(e.message);
                  }
                }}
                className="px-5 py-2 bg-[#283618] text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                حفظ الطبق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ------------------------------------------------------------- */}
      {isCatModalOpen && editingCat && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingCat.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">المفتاح البرمجي (Key) *</label>
                <input
                  type="text"
                  disabled={!!editingCat.id}
                  value={editingCat.key || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, key: e.target.value })}
                  placeholder="e.g. risotto, antipasti, seafood"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={editingCat.names?.ar || ''}
                  onChange={(e) => setEditingCat({
                    ...editingCat,
                    names: { ...editingCat.names, ar: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">الاسم بالإنجليزية *</label>
                <input
                  type="text"
                  required
                  value={editingCat.names?.en || ''}
                  onChange={(e) => setEditingCat({
                    ...editingCat,
                    names: { ...editingCat.names, en: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ترتيب الظهور</label>
                <input
                  type="number"
                  min={1}
                  value={editingCat.sortOrder || 1}
                  onChange={(e) => setEditingCat({ ...editingCat, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl tabular-nums font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  try {
                    if (editingCat.id) {
                      await api.updateCategory(editingCat.id, editingCat);
                      setActionSuccess('تم تحديث التصنيف بنجاح');
                    } else {
                      await api.createCategory({
                        key: editingCat.key || '',
                        names: editingCat.names || {},
                        sortOrder: editingCat.sortOrder
                      });
                      setActionSuccess('تم إنشاء التصنيف الجديد بنجاح');
                    }
                    setIsCatModalOpen(false);
                    loadAdminData();
                    onRefreshPublicData();
                  } catch (e: any) {
                    setActionError(e.message);
                  }
                }}
                className="px-5 py-2 bg-[#283618] text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                حفظ التصنيف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT ADMIN USER & RBAC PERMISSIONS */}
      {/* ------------------------------------------------------------- */}
      {isUserModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {userModalMode === 'create' ? 'إضافة مشرف جديد والصلاحيات' : `تعديل صلاحيات المشرف (${targetUser.username})`}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {userModalMode === 'create' && (
                <div>
                  <label className="block font-semibold mb-1">اسم المستخدم *</label>
                  <input
                    type="text"
                    required
                    value={targetUser.username || ''}
                    onChange={(e) => setTargetUser({ ...targetUser, username: e.target.value })}
                    placeholder="e.g. host_sarah"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold">
                    {userModalMode === 'create' ? 'كلمة المرور *' : 'تحديث كلمة المرور (اختياري)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const temp = 'Gia@' + Math.floor(1000 + Math.random() * 9000);
                      setTargetUser({ ...targetUser, password: temp, isTemporaryPassword: true });
                    }}
                    className="text-[10px] text-[#bc6c25] hover:underline font-bold"
                  >
                    توليد كلمة مرور مؤقتة عشوائية
                  </button>
                </div>
                <input
                  type="text"
                  value={targetUser.password || ''}
                  onChange={(e) => setTargetUser({ ...targetUser, password: e.target.value })}
                  placeholder={userModalMode === 'create' ? 'أدخل كلمة المرور...' : 'اتركه فارغاً للإبقاء على الحالية'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">الدور الأساسي (Role)</label>
                <select
                  value={targetUser.role}
                  onChange={(e) => {
                    const r = e.target.value as AdminRole;
                    let perms: AdminPermission[] = [];
                    if (r === 'superadmin') perms = ALL_POSSIBLE_PERMISSIONS.map(p => p.key);
                    else if (r === 'reservations_manager') perms = ['view_overview', 'view_reservations', 'manage_reservations', 'manage_reservation_rules'];
                    else if (r === 'menu_manager') perms = ['view_overview', 'view_menu', 'manage_menu', 'edit_prices', 'manage_categories'];
                    else if (r === 'content_editor') perms = ['view_overview', 'edit_content', 'manage_translations', 'manage_contact'];
                    else perms = ['view_overview'];

                    setTargetUser({ ...targetUser, role: r, permissions: perms });
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                >
                  <option value="superadmin">Super Admin (مشرف رئيسي — كافة الصلاحيات)</option>
                  <option value="reservations_manager">Reservations Manager (مشرف الحجوزات)</option>
                  <option value="menu_manager">Menu Manager (مشرف قائمة الطعام)</option>
                  <option value="content_editor">Content Editor (محرر المحتوى)</option>
                  <option value="custom">Custom (صلاحيات مخصصة يدوياً)</option>
                </select>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div>
                <label className="block font-semibold mb-1.5">
                  تفاصيل الصلاحيات الممنوحة:
                </label>
                <div className="max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  {ALL_POSSIBLE_PERMISSIONS.map(perm => {
                    const checked = targetUser.role === 'superadmin' || targetUser.permissions?.includes(perm.key);
                    return (
                      <label key={perm.key} className="flex items-center gap-2 cursor-pointer hover:bg-stone-100/60 p-1 rounded">
                        <input
                          type="checkbox"
                          disabled={targetUser.role === 'superadmin'}
                          checked={checked}
                          onChange={(e) => {
                            const current = targetUser.permissions || [];
                            const updated = e.target.checked
                              ? [...current, perm.key]
                              : current.filter(k => k !== perm.key);
                            setTargetUser({ ...targetUser, permissions: updated, role: 'custom' });
                          }}
                          className="accent-[#283618]"
                        />
                        <span className="text-stone-800 font-medium">{perm.labelAr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {targetUser.isTemporaryPassword && (
                <div className="p-2.5 bg-amber-50 text-amber-900 rounded-xl text-[11px] border border-amber-200">
                  سيُطلب من المشرف تغيير كلمة المرور هذه فور تسجيل دخوله الأول.
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  try {
                    if (userModalMode === 'create') {
                      if (!targetUser.username || !targetUser.password) {
                        alert('اسم المستخدم وكلمة المرور مطلوبان');
                        return;
                      }
                      await api.createAdminUser({
                        username: targetUser.username,
                        password: targetUser.password,
                        role: targetUser.role || 'reservations_manager',
                        permissions: targetUser.permissions,
                        isTemporaryPassword: targetUser.isTemporaryPassword
                      });
                      setActionSuccess(`تم إنشاء حساب المشرف ${targetUser.username}`);
                    } else if (targetUser.id) {
                      await api.updateAdminUser(targetUser.id, {
                        role: targetUser.role,
                        permissions: targetUser.permissions,
                        password: targetUser.password || undefined,
                        isTemporaryPassword: targetUser.isTemporaryPassword
                      });
                      setActionSuccess(`تم تعديل صلاحيات المشرف ${targetUser.username}`);
                    }
                    setIsUserModalOpen(false);
                    loadAdminData();
                  } catch (e: any) {
                    setActionError(e.message);
                  }
                }}
                className="px-5 py-2 bg-[#283618] text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                حفظ بيانات المشرف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
