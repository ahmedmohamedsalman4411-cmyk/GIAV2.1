import { SupportedLanguage } from '../i18n/translations';

interface SeoMetadata {
  title: string;
  description: string;
}

const SEO_CONTENT: Record<SupportedLanguage, { home: SeoMetadata; menu: SeoMetadata; admin: SeoMetadata }> = {
  ar: {
    home: {
      title: 'GIA | مطعم إيطالي معاصر في دبي مول',
      description: 'الموقع الرسمي لمطعم جيا (GIA) في فاشن أفينيو بدبي مول. استمتع بأشهى أطباق المعكرونة الطازجة والبيتزا الحرفية مع إطلالة ساحرة على نافورة دبي.'
    },
    menu: {
      title: 'GIA | قائمة الطعام والأسعار - دبي مول',
      description: 'استكشف قائمة طعام مطعم جيا الإيطالي في دبي مول بالأسعار المعتمدة بالدرهم: البوراتا، الترافل، البيتزا على الحطب، والحلويات الإيطالية.'
    },
    admin: {
      title: 'GIA | لوحة إدارة المشرفين',
      description: 'بوابة الإدارة الداخلية لمطعم جيا دبي لإدارة الحجوزات وقائمة الطعام.'
    }
  },
  en: {
    home: {
      title: 'GIA | Contemporary Italian Dining - Dubai Mall',
      description: 'Official website of GIA Restaurant in Fashion Avenue, The Dubai Mall. Authentic handcrafted pasta and artisan pizza with panoramic Dubai Fountain views.'
    },
    menu: {
      title: 'GIA | Menu & Prices - Dubai Mall',
      description: 'Explore the contemporary Italian menu at GIA Dubai Mall. Truffle tagliolini, artisan burrata, wood-fired pizza and traditional desserts with verified AED prices.'
    },
    admin: {
      title: 'GIA | Admin Management Portal',
      description: 'Internal reservation and menu management portal for GIA Dubai administrators.'
    }
  },
  it: {
    home: {
      title: 'GIA | Cucina Italiana Contemporanea - Dubai Mall',
      description: 'Sito ufficiale del ristorante GIA nella Fashion Avenue del Dubai Mall. Pasta fresca artigianale e pizza nel forno a legna con vista sulla Fontana di Dubai.'
    },
    menu: {
      title: 'GIA | Menu e Prezzi - Dubai Mall',
      description: 'Scopri il menu del ristorante italiano GIA a Dubai con prezzi in AED. Tagliolini al tartufo, burrata pugliese, pizze e tiramisù tradizionale.'
    },
    admin: {
      title: 'GIA | Area Riservata Amministratore',
      description: 'Pannello di gestione interna prenotazioni e menu di GIA Dubai.'
    }
  },
  fr: {
    home: {
      title: 'GIA | Restaurant Italien Contemporain - Dubai Mall',
      description: 'Site officiel du restaurant italien GIA à Fashion Avenue, The Dubai Mall. Pâtes fraîches artisanales et vue panoramique sur la Fontaine de Dubaï.'
    },
    menu: {
      title: 'GIA | Menu & Tarifs - Dubai Mall',
      description: 'Découvrez la carte du restaurant GIA à Dubaï avec tarifs en AED : tagliolini à la truffe, burrata artisanale, pizzas au feu de bois et dolci.'
    },
    admin: {
      title: 'GIA | Portail d’Administration',
      description: 'Espace sécurisé de gestion des réservations et des menus GIA Dubaï.'
    }
  },
  es: {
    home: {
      title: 'GIA | Restaurante Italiano - Dubai Mall',
      description: 'Sitio oficial del restaurante italiano GIA en Fashion Avenue, The Dubai Mall. Pasta fresca artesanal y vistas espectaculares a la Fuente de Dubái.'
    },
    menu: {
      title: 'GIA | Menú y Precios - Dubai Mall',
      description: 'Explora la carta y precios oficiales en AED de GIA Dubái: tagliolini con trufa negra, burrata pugliese, pizzas al horno de leña y postres.'
    },
    admin: {
      title: 'GIA | Panel de Administración',
      description: 'Acceso administrativo para gestión de reservas y carta de GIA Dubái.'
    }
  },
  de: {
    home: {
      title: 'GIA | Italienische Küche - Dubai Mall',
      description: 'Offizielle Website des Restaurants GIA in der Fashion Avenue der Dubai Mall. Handgemachte Pasta und Steinofenpizza mit Blick auf die Dubai Fountain.'
    },
    menu: {
      title: 'GIA | Speisekarte & Preise - Dubai Mall',
      description: 'Entdecken Sie die italienische Speisekarte des GIA Dubai mit Preisen in AED: Trüffel-Pasta, Burrata, Holzofenpizza und traditionelles Tiramisù.'
    },
    admin: {
      title: 'GIA | Admin-Portal',
      description: 'Internes Verwaltungsportal für Reservierungen und Menüpflege.'
    }
  },
  nl: {
    home: {
      title: 'GIA | Italiaanse Gastronomie - Dubai Mall',
      description: 'Officiële website van GIA Restaurant in Fashion Avenue, The Dubai Mall. Authentieke verse pasta en uitzicht op de Dubai Fountain.'
    },
    menu: {
      title: 'GIA | Menu & Prijzen - Dubai Mall',
      description: 'Bekijk het actuele menu van GIA Restaurant Dubai met geverifieerde AED prijzen: truffelpasta, burrata, pizza en klassieke desserts.'
    },
    admin: {
      title: 'GIA | Beheerderspaneel',
      description: 'Beheersysteem voor reserveringen en menu van GIA Dubai.'
    }
  },
  pt: {
    home: {
      title: 'GIA | Culinária Italiana - Dubai Mall',
      description: 'Site oficial do restaurante GIA no Fashion Avenue do The Dubai Mall. Massas frescas artesanais e vista privilegiada da Fonte de Dubai.'
    },
    menu: {
      title: 'GIA | Cardápio e Preços - Dubai Mall',
      description: 'Consulte o cardápio e preços em AED do GIA Dubai: tagliolini com trufas, burrata italiana, pizza napolitana e sobremesas artesanais.'
    },
    admin: {
      title: 'GIA | Painel Administrativo',
      description: 'Gestão restrita de reservas e cardápio do restaurante GIA Dubai.'
    }
  },
  zh: {
    home: {
      title: 'GIA | 迪拜购物中心意式餐厅与音乐喷泉景观',
      description: '迪拜购物中心时尚大道GIA当代意大利餐厅官方网站。纯正手工鲜制意面、窑炉披萨，尽享迪拜音乐喷泉一线壮阔景致。'
    },
    menu: {
      title: 'GIA | 精致菜单与价格 (AED) - 迪拜购物中心',
      description: '浏览迪拜GIA餐厅官方菜单与迪拉姆AED价格：黑松露手工面、新鲜布拉塔奶酪、柴火木炉披萨与经典提拉米苏。'
    },
    admin: {
      title: 'GIA | 管理后台',
      description: '迪拜GIA餐厅订座与菜品价格内部管理系统。'
    }
  },
  hi: {
    home: {
      title: 'GIA | समकालीन इतालवी भोजन - द दुबई मॉल',
      description: 'द दुबई मॉल में फैशन एवेन्यू में स्थित GIA रेस्तरां की आधिकारिक वेबसाइट। दुबई फाउंटेन के दृश्य के साथ ताजा पास्ता और पिज्जा।'
    },
    menu: {
      title: 'GIA | मेनू और कीमतें - द दुबई मॉल',
      description: 'GIA दुबई के समकालीन इतालवी मेनू और AED कीमतों का अन्वेषण करें: ट्रफल पास्ता, बुराटा, पिज्जा और तिरामिसु।'
    },
    admin: {
      title: 'GIA | एडमिन पोर्टल',
      description: 'GIA दुबई के लिए आंतरिक बुकिंग और मेनू प्रबंधन पोर्टल।'
    }
  },
  tl: {
    home: {
      title: 'GIA | Italian Dining - The Dubai Mall',
      description: 'Opisyal na website ng GIA Restaurant sa Fashion Avenue, The Dubai Mall. Sariwang pasta at pizza na may tanawin ng Dubai Fountain.'
    },
    menu: {
      title: 'GIA | Menu at Presyo - The Dubai Mall',
      description: 'Tingnan ang menu ng GIA Dubai na may opisyal na presyo sa AED: truffle pasta, burrata pugliese, wood-fired pizza at tiramisu.'
    },
    admin: {
      title: 'GIA | Admin Portal',
      description: 'Panloob na portal ng pamamahala para sa mga reserbasyon at menu ng GIA Dubai.'
    }
  }
};

const ALL_LANGUAGES: SupportedLanguage[] = ['ar', 'en', 'it', 'fr', 'es', 'de', 'nl', 'pt', 'zh', 'hi', 'tl'];

export function updatePageSeo(lang: SupportedLanguage, activeView: 'home' | 'menu' | 'admin') {
  const content = SEO_CONTENT[lang]?.[activeView] || SEO_CONTENT['en'][activeView];
  const baseUrl = window.location.origin;

  // 1. Title
  document.title = content.title;

  // 2. Meta description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', content.description);

  // 3. OpenGraph tags
  const setMeta = (property: string, val: string) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  };

  const setTwitter = (name: string, val: string) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  };

  setMeta('og:title', content.title);
  setMeta('og:description', content.description);
  setMeta('og:type', 'website');
  setMeta('og:url', `${baseUrl}/?lang=${lang}${activeView === 'menu' ? '#menu' : ''}`);
  setMeta('og:image', `${baseUrl}/images/hero_gia_dining_1793363107745.jpg`);

  setTwitter('twitter:card', 'summary_large_image');
  setTwitter('twitter:title', content.title);
  setTwitter('twitter:description', content.description);
  setTwitter('twitter:image', `${baseUrl}/images/hero_gia_dining_1793363107745.jpg`);

  // 4. Robots indexing governance: disallow admin indexing, allow public
  let robotsMeta = document.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    document.head.appendChild(robotsMeta);
  }
  if (activeView === 'admin') {
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');
  } else {
    robotsMeta.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1');
  }

  // 5. Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', `${baseUrl}/?lang=${lang}${activeView === 'menu' ? '#menu' : ''}`);

  // 6. Alternate hreflang tags for all 11 languages
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  ALL_LANGUAGES.forEach(l => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', l);
    link.setAttribute('href', `${baseUrl}/?lang=${l}${activeView === 'menu' ? '#menu' : ''}`);
    document.head.appendChild(link);
  });
  // x-default hreflang pointing to English or Arabic
  const xDefault = document.createElement('link');
  xDefault.setAttribute('rel', 'alternate');
  xDefault.setAttribute('hreflang', 'x-default');
  xDefault.setAttribute('href', `${baseUrl}/?lang=en`);
  document.head.appendChild(xDefault);

  // 7. Schema.org JSON-LD Structured Data
  let schemaScript = document.getElementById('gia-schema-jsonld') as HTMLScriptElement | null;
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'gia-schema-jsonld';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    'name': 'GIA Restaurant Dubai',
    'alternateName': 'مطعم جيا دبي',
    'image': [
      `${baseUrl}/images/hero_gia_dining_1793363107745.jpg`,
      `${baseUrl}/images/dish_truffle_tagliolini_1793363108755.jpg`,
      `${baseUrl}/images/dish_burrata_pugliese_1793363108448.jpg`,
      `${baseUrl}/images/dish_woodfired_pizza_1793363109590.jpg`,
      `${baseUrl}/images/dish_classic_tiramisu_1793363110083.jpg`
    ],
    '@id': `${baseUrl}/#restaurant`,
    'url': baseUrl,
    'telephone': '+97142349986',
    'priceRange': 'AED 45 - AED 195',
    'servesCuisine': ['Italian', 'Contemporary Italian', 'Mediterranean'],
    'menu': `${baseUrl}/#menu`,
    'acceptsReservations': 'True',
    'hasMap': 'https://www.google.com/maps/place/%D9%85%D8%B7%D8%B9%D9%85+%D8%AC%D9%8A%D8%A7%E2%80%AD/@25.1471314,55.2945414,12z/data=!4m10!1m2!2m1!1srestaurants+in+Dubai!3m6!1s0x3e5f6829dc6e8a3f:0x91a7a6821d362108!8m2!3d25.1971421!4d55.2759743!15sChRyZXN0YXVyYW50cyBpbiBEdWJhaVoWIhRyZXN0YXVyYW50cyBpbiBkdWJhaZIBEml0YWxpYW5fcmVzdGF1cmFudJoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQydE9TRmRzV2tWUFZtZDBUMWRHYUUweVpHaGlNalZhVkd0YVVHRnVZeEFC4AEA-gEECCwQRg!16s%2Fg%2F11gf0zxkng?entry=ttu&g_ep=EgoyMDI2MTAyNy4wIKXMDSoASAFQAw%3D%3D',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'The Dubai Mall, Fashion Avenue, Downtown Dubai (Overlooking Dubai Fountain)',
      'addressLocality': 'Dubai',
      'addressRegion': 'Dubai',
      'addressCountry': 'AE'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 25.1971421,
      'longitude': 55.2759743
    },
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        'opens': '10:00',
        'closes': '00:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Friday', 'Saturday'],
        'opens': '10:00',
        'closes': '01:00'
      }
    ]
  };

  schemaScript.text = JSON.stringify(structuredData);
}
