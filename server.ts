import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'restaurant_db.json');

app.use(express.json({ limit: '10mb' }));

// Static asset serving: support both /images and legacy /src/assets/images paths in both dev & prod
const publicImagesPath = path.join(__dirname, 'public', 'images');
const srcImagesPath = path.join(__dirname, 'src', 'assets', 'images');
app.use('/images', express.static(publicImagesPath));
app.use('/src/assets/images', express.static(publicImagesPath));
if (fs.existsSync(srcImagesPath)) {
  app.use('/src/assets/images', express.static(srcImagesPath));
}
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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
  dietaryTags: string[]; // e.g. 'vegetarian', 'gluten-free', 'spicy', 'chef-special'
  sortOrder: number;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  bookingRef: string;
  customerName: string;
  phone: string;
  countryCode: string;
  email?: string;
  guestsCount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
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

export const ALL_PERMISSIONS: AdminPermission[] = [
  'view_overview',
  'view_reservations',
  'manage_reservations',
  'manage_reservation_rules',
  'view_menu',
  'manage_menu',
  'edit_prices',
  'manage_categories',
  'edit_content',
  'manage_translations',
  'manage_contact',
  'manage_seo',
  'manage_currency',
  'view_logs',
  'manage_admins'
];

export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  superadmin: [...ALL_PERMISSIONS],
  reservations_manager: ['view_overview', 'view_reservations', 'manage_reservations', 'manage_reservation_rules'],
  menu_manager: ['view_overview', 'view_menu', 'manage_menu', 'edit_prices', 'manage_categories'],
  content_editor: ['view_overview', 'edit_content', 'manage_translations', 'manage_contact', 'manage_seo'],
  custom: ['view_overview']
};

export interface AdminUser {
  id: string;
  username: string;
  password: string; // Plain or SHA512 PBKDF2 hash
  passwordSalt?: string;
  mustChangePassword: boolean;
  isTemporaryPassword?: boolean;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
}

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'whatsapp' | 'phone' | 'facebook' | 'tiktok' | 'twitter' | 'youtube' | 'maps' | 'other';
  label: string;
  url: string;
  isActive: boolean;
}

export interface RestaurantDatabase {
  settings: {
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
    seoTitle?: string;
    seoTitleAr?: string;
    seoDescription?: string;
    seoDescriptionAr?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
    keywords?: string;
    socialLinks?: SocialLink[];
  };
  reservationSettings: {
    serviceOpeningTime: string; // "12:00"
    serviceClosingTime: string; // "23:30"
    slotIntervalMinutes: number; // 30
    maxGuestsPerParty: number; // 12
    maxCapacityPerSlot: number; // 24
    minNoticeHours: number; // 2
    maxAdvanceDays: number; // 30
    autoConfirm: boolean;
    allowWaitlist?: boolean;
    blackoutDates: string[]; // ['2026-12-31']
    instructions: Record<string, string>;
  };
  menuItems: MenuItem[];
  categories: MenuCategory[];
  reservations: Reservation[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
}

const defaultInitialDatabase: RestaurantDatabase = {
  settings: {
    restaurantName: "GIA Dubai",
    restaurantNameAr: "مطعم جيا دبي",
    logoText: "GIA",
    tagline: {
      ar: "المطبخ الإيطالي المعاصر مع إطلالة ساحرة على نافورة دبي",
      en: "Contemporary Italian dining with panoramic views of the Dubai Fountain",
      it: "Cucina italiana contemporanea con vista mozzafiato sulla Fontana di Dubai",
      fr: "Cuisine italienne contemporaine avec vue panoramique sur la fontaine de Dubaï",
      es: "Cocina italiana contemporánea con vistas panorámicas a la Fuente de Dubái",
      de: "Zeitgenössische italienische Küche mit Panoramablick auf die Dubai Fountain",
      nl: "Hedendaagse Italiaanse keuken met panoramisch uitzicht op de Dubai Fountain",
      pt: "Culinária italiana contemporânea com vista panorâmica da Fonte de Dubai",
      hi: "दुबई फाउंटेन के मनोरम दृश्यों के साथ समकालीन इतालवी भोजन",
      zh: "俯瞰迪拜喷泉壮丽全景的当代意大利风味美食",
      tl: "Kontemporaryong lutuing Italyano na may tanawin ng Dubai Fountain"
    },
    aboutText: {
      ar: "يقدم مطعم جيا تجربة طعام إيطالية راقية تجمع بين التقاليد العريقة والابتكار العصري في قلب فاشن أفينيو بدبي مول. نستورد أفضل المكونات الطازجة من إيطاليا لإعداد أطباق المعكرونة المصنوعة يدويًا، والبيتزا الحرفية، والمقبلات الشهية في أجواء أنيقة ومريحة.",
      en: "Located in Fashion Avenue at The Dubai Mall, GIA offers a contemporary take on authentic Italian gastronomy. Savor artisanal pasta hand-crafted daily, wood-fired pizzas, and indulgent dolci paired with unobstructed panoramic terrace views of the iconic Dubai Fountain.",
      it: "Situato nella Fashion Avenue del Dubai Mall, GIA propone una visione contemporanea dell'autentica gastronomia italiana.",
      fr: "Situé à la Fashion Avenue du Dubai Mall, GIA propose une version contemporaine de l'authentique gastronomie italienne.",
      es: "Ubicado en Fashion Avenue en The Dubai Mall, GIA ofrece una versión contemporánea de la auténtica gastronomía italiana.",
      de: "In der Fashion Avenue der Dubai Mall bietet GIA eine zeitgenössische Interpretation authentischer italienischer Gastronomie.",
      nl: "Gelegen aan Fashion Avenue in The Dubai Mall, biedt GIA een eigentijdse kijk op authentieke Italiaanse gastronomie.",
      pt: "Localizado na Fashion Avenue do The Dubai Mall, o GIA oferece uma versão contemporânea da autêntica gastronomia italiana.",
      hi: "द दुबई मॉल में फैशन एवेन्यू में स्थित, जीआईए प्रामाणिक इतालवी व्यंजनों पर एक समकालीन दृष्टिकोण प्रदान करता है।",
      zh: "GIA位于迪拜购物中心时尚大道，以现代视角重构纯正意大利珍馐。",
      tl: "Matatagpuan sa Fashion Avenue sa The Dubai Mall, nag-aalok ang GIA ng modernong bersyon ng tunay na lutuing Italyano."
    },
    address: "The Dubai Mall, Fashion Avenue, Downtown Dubai (Overlooking Dubai Fountain)",
    addressAr: "دبي مول، فاشن أفينيو، وسط مدينة دبي (إطلالة مباشرة على نافورة دبي)",
    googleMapsUrl: "https://www.google.com/maps/place/%D9%85%D8%B7%D8%B9%D9%85+%D8%AC%D9%8A%D8%A7%E2%80%AD/@25.1471314,55.2945414,12z/data=!4m10!1m2!2m1!1srestaurants+in+Dubai!3m6!1s0x3e5f6829dc6e8a3f:0x91a7a6821d362108!8m2!3d25.1971421!4d55.2759743!15sChRyZXN0YXVyYW50cyBpbiBEdWJhaVoWIhRyZXN0YXVyYW50cyBpbiBkdWJhaZIBEml0YWxpYW5fcmVzdGF1cmFudJoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQydE9TRmRzV2tWUFZtZDBUMWRHYUUweVpHaGlNalZhVkd0YVVHRnVZeEFC4AEA-gEECCwQRg!16s%2Fg%2F11gf0zxkng?entry=ttu&g_ep=EgoyMDI2MTAyNy4wIKXMDSoASAFQAw%3D%3D",
    phone: "+971 4 234 9986",
    whatsapp: "+971 50 123 4567",
    email: "",
    emergencyPhone: "+971 50 999 8877",
    currency: "AED",
    openingHoursWeekdays: "10:00 AM – 12:00 AM (Midnight)",
    openingHoursWeekends: "10:00 AM – 01:00 AM (Fri, Sat, Sun)",
    openingHoursWeekdaysAr: "من 10:00 صباحاً حتى 12:00 منتصف الليل (الأحد - الخميس)",
    openingHoursWeekendsAr: "من 10:00 صباحاً حتى 01:00 بعد منتصف الليل (الجمعة - السبت)",
    instagramUrl: "https://instagram.com/gia.dubai",
    heroImage: "/images/hero_gia_dining_1793363107745.jpg",
    lastUpdated: new Date().toISOString(),
    seoTitle: "GIA Restaurant Dubai | Contemporary Italian Dining",
    seoTitleAr: "مطعم جيا دبي | المطبخ الإيطالي المعاصر في دبي مول",
    seoDescription: "Authentic Italian restaurant at Fashion Avenue, The Dubai Mall. Enjoy handcrafted pasta, pizza, and stunning Dubai Fountain views.",
    seoDescriptionAr: "مطعم إيطالي راقٍ في فاشن أفينيو بدبي مول. استمتع بأطباق الباستا الحرفية، والبيتزا، وإطلالة مباشرة على نافورة دبي.",
    canonicalUrl: "https://gia-dubai.ae",
    ogImageUrl: "/images/hero_gia_dining_1793363107745.jpg",
    keywords: "GIA Dubai, Italian Restaurant Dubai Mall, Dubai Mall Dining, Italian Food Dubai, مطعم جيا, مطعم إيطالي دبي مول",
    socialLinks: [
      { id: "soc-1", platform: "instagram", label: "Instagram @gia.dubai", url: "https://instagram.com/gia.dubai", isActive: true },
      { id: "soc-2", platform: "whatsapp", label: "WhatsApp Concierge", url: "https://wa.me/971501234567", isActive: true },
      { id: "soc-3", platform: "phone", label: "Direct Phone Line", url: "tel:+97142349986", isActive: true },
      { id: "soc-4", platform: "maps", label: "Google Maps Navigation", url: "https://www.google.com/maps/place/%D9%85%D8%B7%D8%B9%D9%85+%D8%AC%D9%8A%D8%A7%E2%80%AD/@25.1471314,55.2945414,12z", isActive: true }
    ]
  },
  reservationSettings: {
    serviceOpeningTime: "12:00",
    serviceClosingTime: "23:30",
    slotIntervalMinutes: 30,
    maxGuestsPerParty: 12,
    maxCapacityPerSlot: 24,
    minNoticeHours: 2,
    maxAdvanceDays: 30,
    autoConfirm: false,
    blackoutDates: [],
    instructions: {
      ar: "يرجى العلم أن الحجز يخضع للموافقة المسبقة من فريق الاستقبال. يتم الاحتفاظ بالطاولة لمدة 15 دقيقة فقط بعد الموعد المحدد. نرحب بالطلبات والمناسبات الخاصة مسبقاً.",
      en: "All table reservations are subject to confirmation by our front desk host team. Tables are held for up to 15 minutes past the reserved time. Special occasions and dietary preferences are handled with care.",
      it: "Tutte le prenotazioni sono soggette a conferma da parte della nostra reception.",
      fr: "Toutes les réservations sont soumises à la confirmation de notre équipe d'accueil.",
      es: "Todas las reservas están sujetas a la confirmación de nuestro equipo de recepción."
    }
  },
  menuItems: [
    {
      id: "item-1",
      category: "pasta",
      names: {
        ar: "تاغليوليني بالترافل الأسود (Tagliolini al Tartufo)",
        en: "Tagliolini al Tartufo",
        it: "Tagliolini al Tartufo Nero",
        fr: "Tagliolini à la Truffe Noire",
        es: "Tagliolini con Trufa Negra",
        de: "Tagliolini mit schwarzem Trüffel",
        nl: "Tagliolini met zwarte truffel",
        pt: "Tagliolini com Trufa Negra",
        hi: "काले ट्रफल के साथ ताग्लियोलिनी",
        zh: "黑松露手工细宽面",
        tl: "Tagliolini na may Black Truffle"
      },
      descriptions: {
        ar: "معكرونة تاغليوليني طازجة محضرة يدوياً، مع شرائح الترافل الأسود الفاخر، وجبنة بارميجيانو ريجيانو المعتقة 24 شهراً ومستحلب الزبدة الإيطالية.",
        en: "Handmade fresh egg tagliolini, freshly shaved Umbrian black truffles, 24-month aged Parmigiano Reggiano emulsion.",
        it: "Tagliolini freschi fatti a mano con tartufo nero umbro a scaglie e crema di Parmigiano Reggiano 24 mesi.",
        fr: "Pâtes tagliolini fraîches faites maison, lamelles de truffe noire d'Ombrie, émulsion de Parmigiano Reggiano 24 mois."
      },
      price: 135,
      currency: "AED",
      image: "/images/dish_truffle_tagliolini_1793363108755.jpg",
      isAvailable: true,
      isFeatured: true,
      dietaryTags: ["vegetarian", "chef-special"],
      sortOrder: 1,
      updatedAt: new Date().toISOString()
    },
    {
      id: "item-2",
      category: "antipasti",
      names: {
        ar: "بوراتا بولييزي الإيطالية الطازجة (Burrata Pugliese)",
        en: "Burrata Pugliese con Datterini",
        it: "Burrata Pugliese con Datterini",
        fr: "Burrata des Pouilles et Tomates Datterini",
        es: "Burrata Pugliese con Tomates Datterini",
        de: "Burrata Pugliese mit Datterini-Tomaten",
        nl: "Burrata Pugliese met Datterini tomaten",
        pt: "Burrata Pugliese com Tomates Datterini",
        hi: "ताजा इतालवी बुराटा पनीर",
        zh: "普利亚新鲜布拉塔奶酪伴达特里尼番茄",
        tl: "Sariwang Italian Burrata Pugliese"
      },
      descriptions: {
        ar: "جبن بوراتا كريمي طازج مستورد من بوجليا الإيطالية، يقدم مع طماطم داتيريني المعسولة، وزيت الريحان العضوي ورقائق ملح البحر.",
        en: "Fresh creamy artisanal Burrata from Puglia, heirloom sweet datterini tomatoes, cold-pressed basil oil, fleur de sel.",
        it: "Burrata artigianale fresca pugliese, pomodorini datterini dolci, olio al basilico spremuto a freddo.",
        fr: "Burrata artisanale fraîche des Pouilles, tomates datterini, huile au basilic pressée à froid."
      },
      price: 88,
      currency: "AED",
      image: "/images/dish_burrata_pugliese_1793363108448.jpg",
      isAvailable: true,
      isFeatured: true,
      dietaryTags: ["vegetarian", "gluten-free"],
      sortOrder: 2,
      updatedAt: new Date().toISOString()
    },
    {
      id: "item-3",
      category: "pizza",
      names: {
        ar: "بيتزا مارغريتا فيراتشي (Pizza Margherita Verace)",
        en: "Pizza Margherita Verace",
        it: "Pizza Margherita Verace Napoletana",
        fr: "Pizza Margherita Véritable",
        es: "Pizza Margherita Verace",
        de: "Echte Pizza Margherita",
        nl: "Echte Pizza Margherita",
        pt: "Pizza Margherita Verace",
        hi: "प्रामाणिक नेपोलिटन पिज्जा मार्गेरिटा",
        zh: "正统那不勒斯玛格丽特披萨",
        tl: "Tunay na Neapolitan Margherita Pizza"
      },
      descriptions: {
        ar: "عجينة مخمرة لـ 48 ساعة مخبوزة على الحطب، مع صلصة طماطم سان مارزانو، وموتزاريلا بوفالو كامبانا الطازجة والريحان الإيطالي.",
        en: "48-hour fermented wood-fired dough, San Marzano DOP tomato sauce, fresh buffalo mozzarella from Campania, fragrant sweet basil.",
        it: "Impasto a lievitazione lenta di 48 ore nel forno a legna, pomodoro San Marzano DOP, mozzarella di bufala campana, basilico.",
        fr: "Pâte fermentée 48h au feu de bois, sauce tomate San Marzano DOP, mozzarella di bufala fraîche, basilic."
      },
      price: 78,
      currency: "AED",
      image: "/images/dish_woodfired_pizza_1793363109590.jpg",
      isAvailable: true,
      isFeatured: true,
      dietaryTags: ["vegetarian"],
      sortOrder: 3,
      updatedAt: new Date().toISOString()
    },
    {
      id: "item-4",
      category: "dolci",
      names: {
        ar: "تيراميسو جيا الكلاسيكي (Tiramisù Tradizionale)",
        en: "Traditional GIA Tiramisù",
        it: "Tiramisù Tradizionale GIA",
        fr: "Tiramisù Traditionnel GIA",
        es: "Tiramisú Tradicional GIA",
        de: "Traditionelles GIA Tiramisù",
        nl: "Traditionele GIA Tiramisù",
        pt: "Tiramisù Tradicional GIA",
        hi: "पारंपरिक इतालवी तिरामिसु",
        zh: "经典意式传统提拉米苏",
        tl: "Tradisyonal na Italian Tiramisu"
      },
      descriptions: {
        ar: "حلوى التيراميسو الإيطالية الكلاسيكية مع بسكويت السافوياردي المشبع بإسبريسو غني، وكريمة الماسكاربوني المخملية ومسحوق الكاكاو الداكن.",
        en: "Classic authentic recipe with espresso-dipped savoiardi ladyfingers, velvety whipped mascarpone mousse, dusted Valrhona cocoa.",
        it: "La classica ricetta autentica con savoiardi imbevuti di espresso italiano, crema al mascarpone e cacao amaro Valrhona.",
        fr: "Recette authentique classique avec biscuits savoiardi imbibés d'espresso, mousse onctueuse de mascarpone et cacao noir."
      },
      price: 55,
      currency: "AED",
      image: "/images/dish_classic_tiramisu_1793363110083.jpg",
      isAvailable: true,
      isFeatured: true,
      dietaryTags: ["vegetarian", "chef-special"],
      sortOrder: 4,
      updatedAt: new Date().toISOString()
    },
    {
      id: "item-5",
      category: "secondi",
      names: {
        ar: "سمك السيباس المحمر (Branzino al Forno)",
        en: "Pan-Seared Mediterranean Branzino",
        it: "Filetto di Branzino al Forno",
        fr: "Filet de Bar de Ligne Méditerranéen",
        es: "Lubina Mediterránea a la Plancha",
        de: "Mittelmeer-Wolfsbarsch",
        nl: "Gebakken Zeebaarsfilet",
        pt: "Robalo Mediterrâneo Grelhado",
        hi: "पैन-सियर्ड मेडिटेरेनियन ब्रान्ज़िनो",
        zh: "香煎地中海海鲈鱼柳",
        tl: "Pan-Seared Mediterranean Branzino"
      },
      descriptions: {
        ar: "فيليه سمك السيباس المتوسطي المشوي بجلد مقرمش، يقدم مع هريس الكرفس، كبر صقلية، طماطم مجففة وصلصة الليمون والأعشاب.",
        en: "Crispy skin Mediterranean sea bass fillet, silky celeriac purée, Pantelleria capers, sun-blushed tomatoes, lemon-herb salmoriglio.",
        it: "Filetto di branzino con pelle croccante, purè di sedano rapa, capperi di Pantelleria e salsa salmoriglio al limone.",
        fr: "Filet de bar croustillant, purée de céleri-rave, câpres de Pantelleria et sauce salmoriglio citronnée."
      },
      price: 165,
      currency: "AED",
      image: "/images/dish_truffle_tagliolini_1793363108755.jpg",
      isAvailable: true,
      isFeatured: false,
      dietaryTags: ["gluten-free"],
      sortOrder: 5,
      updatedAt: new Date().toISOString()
    },
    {
      id: "item-6",
      category: "bevande",
      names: {
        ar: "مشروب جيا أمالفي المنعش (Amalfi Sunset Mocktail)",
        en: "Amalfi Sunset Signature Mocktail",
        it: "Amalfi Sunset Mocktail d'Autore",
        fr: "Cocktail sans alcool Amalfi Sunset",
        es: "Mocktail Exclusivo Amalfi Sunset",
        de: "Amalfi Sunset Signature Mocktail",
        nl: "Amalfi Sunset Handtekening Mocktail",
        pt: "Mocktail Exclusivo Amalfi Sunset",
        hi: "अमाल्फी सनसेट सिग्नेचर मॉकटेल",
        zh: "阿玛菲日落特调无酒精鸡尾酒",
        tl: "Amalfi Sunset Signature Mocktail"
      },
      descriptions: {
        ar: "عصير البرتقال الصقلي الأحمر الطازج، منقوع إكليل الجبل العطري، مياه صودا سان بيليجرينو مع رشة من خلاصة زهر البرتقال.",
        en: "Fresh Sicilian blood orange reduction, fragrant garden rosemary infusion, San Pellegrino sparkling mineral water, citrus twist.",
        it: "Spremuta di arance rosse di Sicilia, infuso di rosmarino fresco, San Pellegrino e scorza di agrumi.",
        fr: "Réduction d'oranges sanguines de Sicile, infusion de romarin, eau pétillante San Pellegrino et zeste d'agrumes."
      },
      price: 42,
      currency: "AED",
      image: "/images/dish_classic_tiramisu_1793363110083.jpg",
      isAvailable: true,
      isFeatured: false,
      dietaryTags: ["vegetarian", "gluten-free"],
      sortOrder: 6,
      updatedAt: new Date().toISOString()
    }
  ],
  reservations: [
    {
      id: "res-1",
      bookingRef: "GIA-92814",
      customerName: "Tariq Al-Mansoor",
      phone: "509876543",
      countryCode: "+971",
      email: "tariq.m@example.com",
      guestsCount: 4,
      date: "2026-11-05",
      time: "20:00",
      occasion: "Anniversary",
      specialRequests: "Fountain view terrace table preferred please.",
      status: "confirmed",
      internalNotes: "VIP table #12 reserved on fountain terrace.",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "res-2",
      bookingRef: "GIA-41723",
      customerName: "Elena Rossi",
      phone: "521122334",
      countryCode: "+971",
      email: "elena.rossi@example.com",
      guestsCount: 2,
      date: "2026-11-06",
      time: "19:30",
      occasion: "Birthday",
      specialRequests: "Birthday candle with dessert if possible.",
      status: "pending",
      internalNotes: "Check with pastry chef for candle presentation.",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ],
  categories: [
    { id: "cat-1", key: "antipasti", names: { ar: "المقبلات والبروشكيتا", en: "Antipasti & Bruschetta", it: "Antipasti" }, sortOrder: 1 },
    { id: "cat-2", key: "pasta", names: { ar: "الباستا الطازجة المصنوعة يدوياً", en: "Fresh Handmade Pasta", it: "Pasta Fresca Artigianale" }, sortOrder: 2 },
    { id: "cat-3", key: "pizza", names: { ar: "البيتزا الإيطالية الحرفية", en: "Artisanal Sourdough Pizza", it: "Pizza Artigianale" }, sortOrder: 3 },
    { id: "cat-4", key: "secondi", names: { ar: "الأطباق الرئيسية واللحوم والمأكولات البحرية", en: "Main Courses & Seafood", it: "Secondi Piatti & Pesce" }, sortOrder: 4 },
    { id: "cat-5", key: "dolci", names: { ar: "الحلويات الإيطالية الفاخرة", en: "Artisanal Desserts", it: "Dolci Tradizionali" }, sortOrder: 5 },
    { id: "cat-6", key: "beverages", names: { ar: "المشروبات والكوكتيلات المنعشة", en: "Mocktails & Beverages", it: "Bevande & Mocktails" }, sortOrder: 6 }
  ],
  adminUsers: [
    {
      id: "admin-default",
      username: "Admin",
      password: "Admin", // Mandatory change requested on initial login
      mustChangePassword: true,
      role: "superadmin",
      permissions: [...ALL_PERMISSIONS],
      createdAt: new Date().toISOString()
    }
  ],
  auditLogs: [
    {
      id: "log-1",
      action: "SYSTEM_INITIALIZED",
      details: "Database initialized with authentic GIA Dubai settings, RBAC roles, and menu items.",
      timestamp: new Date().toISOString(),
      performedBy: "System"
    }
  ]
};

// -------------------------------------------------------------
// CRYPTO & SECURITY UTILITIES
// -------------------------------------------------------------
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, usedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: usedSalt };
}

export function verifyPassword(password: string, storedHashOrPlain: string, salt?: string): boolean {
  if (!salt) {
    // Backwards-compatible check for initial plain seed
    return password === storedHashOrPlain;
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHashOrPlain, 'hex'));
}

// Rate Limiting for Admin Login: max 5 failed attempts per 15 minutes
interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
}
const loginRateLimiter = new Map<string, RateLimitRecord>();

function getRateLimitKey(req: Request, username?: string): string {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  return `${ip}_${(username || '').trim().toLowerCase()}`;
}

function isRateLimited(key: string): { locked: boolean; waitMinutes: number } {
  const record = loginRateLimiter.get(key);
  if (!record) return { locked: false, waitMinutes: 0 };
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const waitMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return { locked: true, waitMinutes: waitMinutes <= 0 ? 1 : waitMinutes };
  }
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginRateLimiter.delete(key);
  }
  return { locked: false, waitMinutes: 0 };
}

function recordFailedLogin(key: string) {
  const record = loginRateLimiter.get(key) || { attempts: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lock
  }
  loginRateLimiter.set(key, record);
}

function recordSuccessfulLogin(key: string) {
  loginRateLimiter.delete(key);
}

// Active Sessions with RBAC
export interface AdminSession {
  token: string;
  userId: string;
  username: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: number;
}
const activeAdminSessions = new Map<string, AdminSession>();

export function getAuthenticatedAdmin(req: Request): AdminSession | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const session = activeAdminSessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeAdminSessions.delete(token);
    return null;
  }
  return session;
}

// Database persistence helpers with automatic schema migration
function readDatabase(): RestaurantDatabase {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultInitialDatabase, null, 2), 'utf-8');
      return defaultInitialDatabase;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed: RestaurantDatabase = JSON.parse(raw);
    let changed = false;

    // Migrate currency
    if (!parsed.settings.currency) {
      parsed.settings.currency = 'AED';
      changed = true;
    }

    // Migrate social links
    if (!parsed.settings.socialLinks || !Array.isArray(parsed.settings.socialLinks) || parsed.settings.socialLinks.length === 0) {
      parsed.settings.socialLinks = [
        { id: "soc-1", platform: "instagram", label: "Instagram @gia.dubai", url: parsed.settings.instagramUrl || "https://instagram.com/gia.dubai", isActive: true },
        { id: "soc-2", platform: "whatsapp", label: "WhatsApp Concierge", url: `https://wa.me/${(parsed.settings.whatsapp || '+971501234567').replace(/[^0-9]/g, '')}`, isActive: true },
        { id: "soc-3", platform: "phone", label: "Direct Phone Line", url: `tel:${(parsed.settings.phone || '+97142349986').replace(/\s+/g, '')}`, isActive: true },
        { id: "soc-4", platform: "maps", label: "Google Maps Navigation", url: parsed.settings.googleMapsUrl || "https://www.google.com/maps/place/%D9%85%D8%B7%D8%B9%D9%85+%D8%AC%D9%8A%D8%A7%E2%80%AD/@25.1471314,55.2945414,12z", isActive: true }
      ];
      changed = true;
    }

    // Migrate SEO fields
    if (!parsed.settings.seoTitle) {
      parsed.settings.seoTitle = "GIA Restaurant Dubai | Contemporary Italian Dining";
      parsed.settings.seoTitleAr = "مطعم جيا دبي | المطبخ الإيطالي المعاصر في دبي مول";
      parsed.settings.seoDescription = "Authentic Italian restaurant at Fashion Avenue, The Dubai Mall. Handcrafted pasta, pizza, and stunning Dubai Fountain views.";
      parsed.settings.seoDescriptionAr = "مطعم إيطالي راقٍ في فاشن أفينيو بدبي مول. استمتع بأطباق الباستا الحرفية، والبيتزا، وإطلالة مباشرة على نافورة دبي.";
      parsed.settings.canonicalUrl = "https://gia-dubai.ae";
      parsed.settings.ogImageUrl = "/src/assets/images/hero_gia_dining_1793363107745.jpg";
      parsed.settings.keywords = "GIA Dubai, Italian Restaurant Dubai Mall, Dubai Mall Dining, Italian Food Dubai, مطعم جيا, مطعم إيطالي دبي مول";
      changed = true;
    }

    // Migrate categories
    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      parsed.categories = [...defaultInitialDatabase.categories];
      changed = true;
    }

    // Migrate admin user roles & permissions
    if (parsed.adminUsers && Array.isArray(parsed.adminUsers)) {
      parsed.adminUsers = parsed.adminUsers.map(u => {
        let userRole: AdminRole = u.role as AdminRole;
        if ((u.role as string) === 'manager') userRole = 'reservations_manager';
        if (!['superadmin', 'reservations_manager', 'menu_manager', 'content_editor', 'custom'].includes(userRole)) {
          userRole = 'superadmin';
        }
        const userPerms = (u.permissions && u.permissions.length > 0)
          ? u.permissions
          : ROLE_DEFAULT_PERMISSIONS[userRole] || ['view_overview'];

        if (userRole !== u.role || !u.permissions) {
          changed = true;
        }

        return {
          ...u,
          role: userRole,
          permissions: userPerms
        };
      });
    }

    // Ensure allowWaitlist setting
    if (parsed.reservationSettings && parsed.reservationSettings.allowWaitlist === undefined) {
      parsed.reservationSettings.allowWaitlist = true;
      changed = true;
    }

    if (changed) {
      writeDatabase(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return defaultInitialDatabase;
  }
}

function writeDatabase(db: RestaurantDatabase): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Ensure database is created on launch
readDatabase();

// -------------------------------------------------------------
// PUBLIC API ROUTES
// -------------------------------------------------------------

// Get public website data (settings, menu items, categories, basic reservation limits)
app.get('/api/public/data', (_req: Request, res: Response) => {
  const db = readDatabase();
  // Filter only available menu items for public visitors
  const publicMenuItems = db.menuItems
    .filter(item => item.isAvailable)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  res.json({
    settings: db.settings,
    reservationSettings: {
      serviceOpeningTime: db.reservationSettings.serviceOpeningTime,
      serviceClosingTime: db.reservationSettings.serviceClosingTime,
      slotIntervalMinutes: db.reservationSettings.slotIntervalMinutes,
      maxGuestsPerParty: db.reservationSettings.maxGuestsPerParty,
      maxAdvanceDays: db.reservationSettings.maxAdvanceDays,
      instructions: db.reservationSettings.instructions,
      blackoutDates: db.reservationSettings.blackoutDates,
      allowWaitlist: db.reservationSettings.allowWaitlist ?? true
    },
    categories: (db.categories || []).sort((a, b) => a.sortOrder - b.sortOrder),
    menuItems: publicMenuItems
  });
});

// Check available slots for a selected date
app.get('/api/public/available-slots', (req: Request, res: Response) => {
  const dateStr = req.query.date as string;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    res.status(400).json({ error: 'Invalid or missing date parameter (format: YYYY-MM-DD)' });
    return;
  }

  const db = readDatabase();
  const { blackoutDates, serviceOpeningTime, serviceClosingTime, slotIntervalMinutes, maxCapacityPerSlot } = db.reservationSettings;

  if (blackoutDates.includes(dateStr)) {
    res.json({ date: dateStr, isBlackout: true, slots: [] });
    return;
  }

  // Generate slots from opening to closing time
  const [openHour, openMin] = serviceOpeningTime.split(':').map(Number);
  const [closeHour, closeMin] = serviceClosingTime.split(':').map(Number);

  const startMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;

  const dayReservations = db.reservations.filter(
    r => r.date === dateStr && r.status !== 'cancelled' && r.status !== 'no-show'
  );

  const slots: { time: string; availableGuests: number; isFull: boolean }[] = [];

  for (let m = startMinutes; m <= endMinutes; m += slotIntervalMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    // Calculate booked guests in this slot
    const slotGuests = dayReservations
      .filter(r => r.time === timeStr)
      .reduce((sum, r) => sum + r.guestsCount, 0);

    const availableGuests = Math.max(0, maxCapacityPerSlot - slotGuests);
    slots.push({
      time: timeStr,
      availableGuests,
      isFull: availableGuests <= 0
    });
  }

  res.json({
    date: dateStr,
    isBlackout: false,
    slots
  });
});

// Create new customer reservation
app.post('/api/public/reservations', (req: Request, res: Response) => {
  const { customerName, phone, countryCode, email, guestsCount, date, time, occasion, specialRequests, isWaitlist } = req.body;

  if (!customerName || !phone || !guestsCount || !date || !time) {
    res.status(400).json({ error: 'Missing required reservation fields' });
    return;
  }

  // Date validation: no past dates (based on Dubai GST timezone)
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  if (date < today) {
    res.status(400).json({ error: 'Cannot book reservations in the past' });
    return;
  }

  const db = readDatabase();
  const { blackoutDates, maxGuestsPerParty, maxCapacityPerSlot, autoConfirm } = db.reservationSettings;

  if (blackoutDates.includes(date)) {
    res.status(400).json({ error: 'The restaurant is closed for bookings on this selected date' });
    return;
  }

  const guests = Number(guestsCount);
  if (guests <= 0 || guests > maxGuestsPerParty) {
    res.status(400).json({ error: `Guests count must be between 1 and ${maxGuestsPerParty}` });
    return;
  }

  // Capacity check
  const bookedInSlot = db.reservations
    .filter(r => r.date === date && r.time === time && r.status !== 'cancelled' && r.status !== 'no-show' && r.status !== 'waitlist')
    .reduce((sum, r) => sum + r.guestsCount, 0);

  let bookingStatus: Reservation['status'] = autoConfirm ? 'confirmed' : 'new';
  let isWaitlisted = false;

  if (bookedInSlot + guests > maxCapacityPerSlot || isWaitlist) {
    if (isWaitlist) {
      bookingStatus = 'waitlist';
      isWaitlisted = true;
    } else {
      res.status(400).json({
        error: 'The requested time slot has reached full capacity. You can join the waitlist.',
        canWaitlist: true
      });
      return;
    }
  }

  // Generate unique booking reference GIA-XXXXX
  const randomRef = 'GIA-' + Math.floor(10000 + Math.random() * 90000);
  const newReservation: Reservation = {
    id: 'res-' + Date.now(),
    bookingRef: randomRef,
    customerName: customerName.trim(),
    phone: phone.trim(),
    countryCode: countryCode || '+971',
    email: email ? email.trim() : undefined,
    guestsCount: guests,
    date,
    time,
    occasion: occasion?.trim() || undefined,
    specialRequests: specialRequests?.trim() || undefined,
    status: bookingStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.reservations.unshift(newReservation);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: isWaitlisted ? 'WAITLIST_RESERVATION' : 'NEW_RESERVATION',
    details: `${isWaitlisted ? 'Waitlist entry' : 'Booking'} ${randomRef} created for ${customerName} (${guests} guests on ${date} at ${time}).`,
    timestamp: new Date().toISOString(),
    performedBy: 'Customer (Online Booking)'
  });

  writeDatabase(db);

  let successMessage = '';
  if (isWaitlisted) {
    successMessage = 'تم تسجيل طلبك في قائمة الانتظار بنجاح. سيقوم فريق الاستقبال بالتواصل معك فور توفر مقاعد.';
  } else if (autoConfirm) {
    successMessage = 'تم تأكيد حجزك تلقائياً بنجاح! نتطلع للترحيب بك في مطعم جيا.';
  } else {
    successMessage = 'تم استلام طلب حجزك بنجاح. سيقوم فريق الاستقبال بمراجعته وإرسال التأكيد قريباً.';
  }

  res.status(201).json({
    success: true,
    bookingRef: randomRef,
    status: newReservation.status,
    reservation: newReservation,
    message: successMessage
  });
});

// -------------------------------------------------------------
// TECHNICAL SEO ROUTES (robots.txt and sitemap.xml)
// -------------------------------------------------------------

// robots.txt: Disallow indexing of admin routes, allow public pages and sitemap
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const sitemapUrl = `${protocol}://${host}/sitemap.xml`;

  const robots = [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /admin/*',
    'Disallow: /api/admin',
    'Disallow: /api/admin/*',
    'Allow: /',
    'Allow: /api/public/*',
    '',
    `Sitemap: ${sitemapUrl}`,
    ''
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(robots);
});

// sitemap.xml: XML sitemap with 11 language variations and alternate hreflang tags
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;
  const now = new Date().toISOString().split('T')[0];
  const languages = ['ar', 'en', 'it', 'fr', 'es', 'de', 'nl', 'pt', 'zh', 'hi', 'tl'];

  const alternateLinks = languages
    .map(lang => `      <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}/?lang=${lang}" />`)
    .join('\n');

  const xmlEntries = languages.map(lang => {
    return `  <url>
    <loc>${baseUrl}/?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${lang === 'ar' || lang === 'en' ? '1.0' : '0.8'}</priority>
${alternateLinks}
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlEntries}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

// -------------------------------------------------------------
// ADMIN AUTH & MANAGEMENT ROUTES
// -------------------------------------------------------------

// Admin login with rate limiting, generic errors, and secure password validation
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    return;
  }

  const rateKey = getRateLimitKey(req, username);
  const rateStatus = isRateLimited(rateKey);
  if (rateStatus.locked) {
    res.status(429).json({
      error: `تم تجاوز الحد الأقصى للمحاولات المسموح بها (5 محاولات). يرجى الانتظار ${rateStatus.waitMinutes} دقيقة قبل إعادة المحاولة لحماية أمان الموقع.`
    });
    return;
  }

  const db = readDatabase();
  const user = db.adminUsers.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  const isValid = user && verifyPassword(password, user.password, user.passwordSalt);

  if (!user || !isValid) {
    recordFailedLogin(rateKey);
    db.auditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'ADMIN_LOGIN_FAILED',
      details: `محاولة دخول فاشلة للمشرف '${username}'.`,
      timestamp: new Date().toISOString(),
      performedBy: username,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'
    });
    writeDatabase(db);

    res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    return;
  }

  // Clear failed login attempts upon success
  recordSuccessfulLogin(rateKey);

  // Auto-upgrade plain password to PBKDF2 hash with salt if not already hashed
  if (!user.passwordSalt) {
    const hashed = hashPassword(password);
    user.password = hashed.hash;
    user.passwordSalt = hashed.salt;
  }

  // Generate secure cryptographic session token
  const sessionToken = 'gia-sec-' + crypto.randomBytes(32).toString('hex');
  user.lastLogin = new Date().toISOString();

  activeAdminSessions.set(sessionToken, {
    token: sessionToken,
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || ['view_overview'],
    createdAt: Date.now()
  });

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'ADMIN_LOGIN_SUCCESS',
    details: `تم تسجيل دخول المشرف '${user.username}' بنجاح برتبة '${user.role}'.`,
    timestamp: new Date().toISOString(),
    performedBy: user.username,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'
  });
  writeDatabase(db);

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || ['view_overview'],
      mustChangePassword: user.mustChangePassword,
      isTemporaryPassword: user.isTemporaryPassword
    },
    token: sessionToken
  });
});

// Admin change password
app.post('/api/admin/change-password', (req: Request, res: Response) => {
  const { username, currentPassword, newPassword } = req.body;
  if (!username || !currentPassword || !newPassword) {
    res.status(400).json({ error: 'كافة حقول كلمة المرور مطلوبة' });
    return;
  }

  if (newPassword.length < 5) {
    res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور الجديدة عن 5 أحرف أو أرقام' });
    return;
  }

  if (newPassword === 'Admin') {
    res.status(400).json({ error: 'لا يمكن إعادة استخدام كلمة المرور الافتراضية' });
    return;
  }

  const db = readDatabase();
  const user = db.adminUsers.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user || !verifyPassword(currentPassword, user.password, user.passwordSalt)) {
    res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    return;
  }

  const hashed = hashPassword(newPassword);
  user.password = hashed.hash;
  user.passwordSalt = hashed.salt;
  user.mustChangePassword = false;
  user.isTemporaryPassword = false;

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'PASSWORD_CHANGED',
    details: `تم تحديث وتشفير كلمة المرور للمشرف '${user.username}'.`,
    timestamp: new Date().toISOString(),
    performedBy: user.username
  });

  writeDatabase(db);

  res.json({
    success: true,
    message: 'تم تحديث كلمة المرور بنجاح'
  });
});

// Admin full data fetch
app.get('/api/admin/data', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json({
    settings: db.settings,
    reservationSettings: db.reservationSettings,
    menuItems: db.menuItems.sort((a, b) => a.sortOrder - b.sortOrder),
    categories: (db.categories || []).sort((a, b) => a.sortOrder - b.sortOrder),
    reservations: db.reservations,
    auditLogs: db.auditLogs.slice(0, 100),
    adminUsers: db.adminUsers.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      permissions: u.permissions || ROLE_DEFAULT_PERMISSIONS[u.role] || ['view_overview'],
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      mustChangePassword: u.mustChangePassword,
      isTemporaryPassword: u.isTemporaryPassword
    }))
  });
});

// Upload image for Dish or Logo/Favicon (Base64 file upload)
app.post('/api/admin/upload-image', (req: Request, res: Response) => {
  const { base64Data, mimeType } = req.body;
  if (!base64Data) {
    res.status(400).json({ error: 'لم يتم توفير ملف الصورة' });
    return;
  }

  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
  if (mimeType && !allowedMime.includes(mimeType)) {
    res.status(400).json({ error: 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG, WEBP, أو AVIF.' });
    return;
  }

  // 5MB length check
  if (base64Data.length > 7 * 1024 * 1024) {
    res.status(400).json({ error: 'حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).' });
    return;
  }

  const imageUrl = base64Data.startsWith('data:') ? base64Data : `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;

  res.json({ success: true, imageUrl });
});

// Update Site Settings (with SuperAdmin check for currency)
app.put('/api/admin/settings', (req: Request, res: Response) => {
  const db = readDatabase();
  const updatedSettings = req.body;

  // RBAC: Changing currency is strictly restricted to SuperAdmin
  if (updatedSettings.currency && updatedSettings.currency !== db.settings.currency) {
    const session = getAuthenticatedAdmin(req);
    if (session && session.role !== 'superadmin') {
      res.status(403).json({
        error: 'صلاحية تغيير عملة الموقع مقصورة على المشرف الأعلى (SuperAdmin) فقط.'
      });
      return;
    }
    // Synchronize currency across all menu dishes
    db.menuItems.forEach(item => {
      item.currency = updatedSettings.currency;
    });
  }

  db.settings = {
    ...db.settings,
    ...updatedSettings,
    lastUpdated: new Date().toISOString()
  };

  const session = getAuthenticatedAdmin(req);
  const performer = session?.username || 'Admin';

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'SETTINGS_UPDATED',
    details: `تم تحديث إعدادات وهوية وبيانات الموقع والـ SEO (العملة: ${db.settings.currency}).`,
    timestamp: new Date().toISOString(),
    performedBy: performer
  });

  writeDatabase(db);
  res.json({ success: true, settings: db.settings });
});

// Update Reservation Settings
app.put('/api/admin/reservation-settings', (req: Request, res: Response) => {
  const db = readDatabase();
  const updated = req.body;

  db.reservationSettings = {
    ...db.reservationSettings,
    ...updated
  };

  const session = getAuthenticatedAdmin(req);
  const performer = session?.username || 'Admin';

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'RESERVATION_SETTINGS_UPDATED',
    details: `Reservation parameters updated: Opening=${db.reservationSettings.serviceOpeningTime}, SlotCapacity=${db.reservationSettings.maxCapacityPerSlot}`,
    timestamp: new Date().toISOString(),
    performedBy: performer
  });

  writeDatabase(db);
  res.json({ success: true, reservationSettings: db.reservationSettings });
});

// Menu Item: Create
app.post('/api/admin/menu/items', (req: Request, res: Response) => {
  const db = readDatabase();
  const itemData = req.body;

  if (!itemData.names?.en && !itemData.names?.ar) {
    res.status(400).json({ error: 'Item must have at least an Arabic or English name' });
    return;
  }

  const newItem: MenuItem = {
    id: 'item-' + Date.now(),
    category: itemData.category || 'pasta',
    names: itemData.names || {},
    descriptions: itemData.descriptions || {},
    price: Number(itemData.price) || 0,
    currency: 'AED',
    image: itemData.image || '/src/assets/images/dish_truffle_tagliolini_1793363108755.jpg',
    isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
    isFeatured: !!itemData.isFeatured,
    dietaryTags: Array.isArray(itemData.dietaryTags) ? itemData.dietaryTags : [],
    sortOrder: Number(itemData.sortOrder) || db.menuItems.length + 1,
    updatedAt: new Date().toISOString()
  };

  db.menuItems.push(newItem);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'MENU_ITEM_CREATED',
    details: `Added new dish '${newItem.names.en || newItem.names.ar}' (${newItem.price} AED).`,
    timestamp: new Date().toISOString(),
    performedBy: 'Admin'
  });

  writeDatabase(db);
  res.status(201).json({ success: true, item: newItem });
});

// Menu Item: Update
app.put('/api/admin/menu/items/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.menuItems.findIndex(i => i.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Menu item not found' });
    return;
  }

  const current = db.menuItems[index];
  const updated: MenuItem = {
    ...current,
    ...req.body,
    id: current.id,
    price: Number(req.body.price !== undefined ? req.body.price : current.price),
    currency: 'AED',
    sortOrder: Number(req.body.sortOrder !== undefined ? req.body.sortOrder : current.sortOrder),
    updatedAt: new Date().toISOString()
  };

  db.menuItems[index] = updated;
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'MENU_ITEM_UPDATED',
    details: `Updated dish '${updated.names.en || updated.names.ar}'. Available=${updated.isAvailable}.`,
    timestamp: new Date().toISOString(),
    performedBy: 'Admin'
  });

  writeDatabase(db);
  res.json({ success: true, item: updated });
});

// Menu Item: Delete
app.delete('/api/admin/menu/items/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDatabase();
  const item = db.menuItems.find(i => i.id === id);

  if (!item) {
    res.status(404).json({ error: 'Menu item not found' });
    return;
  }

  db.menuItems = db.menuItems.filter(i => i.id !== id);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'MENU_ITEM_DELETED',
    details: `Deleted dish '${item.names.en || item.names.ar}'.`,
    timestamp: new Date().toISOString(),
    performedBy: 'Admin'
  });

  writeDatabase(db);
  res.json({ success: true, message: 'Item deleted' });
});

// Reservation: Update Status or Details
app.put('/api/admin/reservations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDatabase();
  const reservation = db.reservations.find(r => r.id === id);

  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }

  const oldStatus = reservation.status;
  const { status, internalNotes, guestsCount, date, time } = req.body;

  if (status) reservation.status = status;
  if (internalNotes !== undefined) reservation.internalNotes = internalNotes;
  if (guestsCount) reservation.guestsCount = Number(guestsCount);
  if (date) reservation.date = date;
  if (time) reservation.time = time;
  reservation.updatedAt = new Date().toISOString();

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'RESERVATION_UPDATED',
    details: `Reservation ${reservation.bookingRef} modified. Status: ${oldStatus} -> ${reservation.status}.`,
    timestamp: new Date().toISOString(),
    performedBy: 'Admin'
  });

  writeDatabase(db);
  res.json({ success: true, reservation });
});

// Delete cancelled or completed reservation
app.delete('/api/admin/reservations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.reservations.findIndex(r => r.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'الحجز المطلوب غير موجود' });
    return;
  }

  const target = db.reservations[index];

  // Check RBAC permission if session exists
  const session = getAuthenticatedAdmin(req);
  if (session && session.role !== 'superadmin' && !session.permissions?.includes('manage_reservations')) {
    res.status(403).json({ error: 'ليس لديك صلاحية حذف الحجوزات.' });
    return;
  }

  // Deletable statuses: cancelled, completed, no-show, or past dates
  const isDeletable = target.status === 'cancelled' || target.status === 'completed' || target.status === 'no-show';
  if (!isDeletable) {
    res.status(400).json({
      error: 'لا يمكن حذف الحجوزات القائمة والنشطة (جديد أو مؤكد). يرجى إلغاء الحجز أولاً ليتاح حذفه نهائياً.'
    });
    return;
  }

  const performer = session?.username || 'Admin';

  db.reservations.splice(index, 1);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'RESERVATION_DELETED',
    details: `تم حذف الحجز الملغي/المنتهي نهائياً برقم ${target.bookingRef} للضيف ${target.customerName} (${target.date} الساعة ${target.time}).`,
    timestamp: new Date().toISOString(),
    performedBy: performer
  });

  writeDatabase(db);
  res.json({
    success: true,
    message: `تم حذف الحجز ${target.bookingRef} بنجاح.`,
    deletedId: id
  });
});

// Export reservations to CSV
app.get('/api/admin/reservations/export-csv', (_req: Request, res: Response) => {
  const db = readDatabase();
  const headers = ['Ref Code', 'Guest Name', 'Phone', 'Email', 'Guests', 'Date', 'Time', 'Status', 'Occasion', 'Special Requests', 'Created At'];
  const rows = db.reservations.map(r => [
    `"${r.bookingRef}"`,
    `"${r.customerName.replace(/"/g, '""')}"`,
    `"${(r.countryCode || '') + r.phone}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    r.guestsCount,
    `"${r.date}"`,
    `"${r.time}"`,
    `"${r.status}"`,
    `"${(r.occasion || '').replace(/"/g, '""')}"`,
    `"${(r.specialRequests || '').replace(/"/g, '""')}"`,
    `"${r.createdAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=gia_reservations_${new Date().toISOString().split('T')[0]}.csv`);
  res.send('\uFEFF' + csvContent);
});

// -------------------------------------------------------------
// MENU CATEGORIES MANAGEMENT ROUTES
// -------------------------------------------------------------

// Get categories
app.get('/api/admin/categories', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json({ categories: (db.categories || []).sort((a, b) => a.sortOrder - b.sortOrder) });
});

// Add Category
app.post('/api/admin/categories', (req: Request, res: Response) => {
  const { key, names, sortOrder } = req.body;
  if (!key || !names) {
    res.status(400).json({ error: 'Key and names are required for category' });
    return;
  }

  const db = readDatabase();
  const safeKey = key.trim().toLowerCase().replace(/\s+/g, '-');
  if (db.categories.some(c => c.key === safeKey)) {
    res.status(400).json({ error: 'Category key already exists' });
    return;
  }

  const newCat: MenuCategory = {
    id: 'cat-' + Date.now(),
    key: safeKey,
    names: names || { ar: safeKey, en: safeKey },
    sortOrder: Number(sortOrder) || db.categories.length + 1
  };

  db.categories.push(newCat);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'CATEGORY_CREATED',
    details: `Added new category '${newCat.names.ar || newCat.names.en}' (${newCat.key}).`,
    timestamp: new Date().toISOString(),
    performedBy: 'Admin'
  });

  writeDatabase(db);
  res.status(201).json({ success: true, category: newCat });
});

// Update Category
app.put('/api/admin/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.categories.findIndex(c => c.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const current = db.categories[index];
  const updated: MenuCategory = {
    ...current,
    ...req.body,
    id: current.id,
    sortOrder: Number(req.body.sortOrder !== undefined ? req.body.sortOrder : current.sortOrder)
  };

  db.categories[index] = updated;
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'CATEGORY_UPDATED',
    details: `Updated category '${updated.names.ar || updated.names.en}'.`,
    timestamp: new Date().toISOString(),
    performedBy: 'Admin'
  });

  writeDatabase(db);
  res.json({ success: true, category: updated });
});

// Delete Category
app.delete('/api/admin/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDatabase();
  const cat = db.categories.find(c => c.id === id);

  if (!cat) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  // Prevent deleting if dishes are assigned to it
  const attachedDishes = db.menuItems.filter(i => i.category === cat.key);
  if (attachedDishes.length > 0) {
    res.status(400).json({
      error: `Cannot delete category '${cat.names.ar || cat.names.en}' because it contains ${attachedDishes.length} menu items. Reassign or delete those dishes first.`
    });
    return;
  }

  db.categories = db.categories.filter(c => c.id !== id);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'CATEGORY_DELETED',
    details: `Deleted category '${cat.names.ar || cat.names.en}'.`,
    timestamp: new Date().toISOString(),
    performedBy: 'Admin'
  });

  writeDatabase(db);
  res.json({ success: true, message: 'Category deleted' });
});

// -------------------------------------------------------------
// ADMIN USERS & RBAC PERMISSIONS ROUTES
// -------------------------------------------------------------

// Add New Admin User
app.post('/api/admin/users', (req: Request, res: Response) => {
  const { username, password, role, permissions, mustChangePassword, isTemporaryPassword } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const db = readDatabase();
  if (db.adminUsers.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
    res.status(400).json({ error: 'Username already exists' });
    return;
  }

  const userRole: AdminRole = role || 'reservations_manager';
  const userPerms: AdminPermission[] = (permissions && Array.isArray(permissions) && permissions.length > 0)
    ? permissions
    : ROLE_DEFAULT_PERMISSIONS[userRole] || ['view_overview'];

  const newUser: AdminUser = {
    id: 'admin-' + Date.now(),
    username: username.trim(),
    password: password,
    mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : !!isTemporaryPassword,
    isTemporaryPassword: !!isTemporaryPassword,
    role: userRole,
    permissions: userPerms,
    createdAt: new Date().toISOString()
  };

  db.adminUsers.push(newUser);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'ADMIN_USER_CREATED',
    details: `New administrator '${newUser.username}' created with role '${newUser.role}'.`,
    timestamp: new Date().toISOString(),
    performedBy: 'SuperAdmin'
  });

  writeDatabase(db);
  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      permissions: newUser.permissions,
      createdAt: newUser.createdAt,
      mustChangePassword: newUser.mustChangePassword,
      isTemporaryPassword: newUser.isTemporaryPassword
    }
  });
});

// Update Admin User (Role, permissions, password)
app.put('/api/admin/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, permissions, password, mustChangePassword, isTemporaryPassword } = req.body;
  const db = readDatabase();
  const user = db.adminUsers.find(u => u.id === id);

  if (!user) {
    res.status(404).json({ error: 'Admin user not found' });
    return;
  }

  // Safeguard: Cannot demote the last SuperAdmin
  const superAdmins = db.adminUsers.filter(u => u.role === 'superadmin');
  if (user.role === 'superadmin' && role && role !== 'superadmin' && superAdmins.length <= 1) {
    res.status(400).json({
      error: 'لا يمكن تعديل رتبة المشرف الرئيسي الوحيد في النظام لحماية أمان الموقع.'
    });
    return;
  }

  if (role) {
    const validRole = role as AdminRole;
    user.role = validRole;
    if (!permissions || permissions.length === 0) {
      user.permissions = ROLE_DEFAULT_PERMISSIONS[validRole] || ['view_overview'];
    }
  }

  if (permissions && Array.isArray(permissions)) {
    user.permissions = permissions;
  }

  if (password) {
    user.password = password;
  }

  if (mustChangePassword !== undefined) {
    user.mustChangePassword = mustChangePassword;
  }

  if (isTemporaryPassword !== undefined) {
    user.isTemporaryPassword = isTemporaryPassword;
  }

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'ADMIN_USER_UPDATED',
    details: `Admin user '${user.username}' updated. Role: ${user.role}.`,
    timestamp: new Date().toISOString(),
    performedBy: 'SuperAdmin'
  });

  writeDatabase(db);
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      mustChangePassword: user.mustChangePassword,
      isTemporaryPassword: user.isTemporaryPassword
    }
  });
});

// Delete Admin User
app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDatabase();
  const user = db.adminUsers.find(u => u.id === id);

  if (!user) {
    res.status(404).json({ error: 'Admin user not found' });
    return;
  }

  // Safeguard: Cannot delete the last SuperAdmin
  const superAdmins = db.adminUsers.filter(u => u.role === 'superadmin');
  if (user.role === 'superadmin' && superAdmins.length <= 1) {
    res.status(400).json({
      error: 'لا يمكن حذف المشرف الرئيسي الوحيد في النظام. يجب أن يبقى مشرف رئيسي واحد على الأقل.'
    });
    return;
  }

  db.adminUsers = db.adminUsers.filter(u => u.id !== id);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'ADMIN_USER_DELETED',
    details: `Deleted admin account '${user.username}' (${user.role}).`,
    timestamp: new Date().toISOString(),
    performedBy: 'SuperAdmin'
  });

  writeDatabase(db);
  res.json({ success: true, message: 'User deleted' });
});

// Vite Middleware Integration for Development & Static Serving for Production
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('GIA Dubai: Application index.html not found. Please run `npm run build`.');
        }
      });
    } else {
      app.get('*', (_req, res) => {
        res.status(503).send('GIA Dubai: Dist directory not found. Please run `npm run build` before starting production server.');
      });
    }
  }

  const portNumber = Number(PORT) || 3000;
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`GIA Restaurant Server running on http://0.0.0.0:${portNumber}`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
});
