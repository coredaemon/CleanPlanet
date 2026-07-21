export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  priceFrom: number | null;
  category: 'home' | 'business';
  featured: boolean;
  calculatorType: 'apartment' | 'house' | 'business' | 'glass';
}

export const services: Service[] = [
  {
    slug: 'uborka-kvartir',
    title: 'Уборка квартир в Москве',
    shortTitle: 'Уборка квартир',
    description: 'Разовая и регулярная уборка квартир с предварительным расчётом.',
    priceFrom: null,
    category: 'home',
    featured: true,
    calculatorType: 'apartment',
  },
  {
    slug: 'podderzhivayushchaya-uborka',
    title: 'Поддерживающая уборка квартиры в Москве',
    shortTitle: 'Поддерживающая уборка',
    description: 'Регулярный или разовый клининг для поддержания порядка.',
    priceFrom: null,
    category: 'home',
    featured: true,
    calculatorType: 'apartment',
  },
  {
    slug: 'generalnaya-uborka',
    title: 'Генеральная уборка квартиры в Москве',
    shortTitle: 'Генеральная уборка',
    description: 'Глубокая обработка комнат, кухни, санузлов и труднодоступных зон.',
    priceFrom: null,
    category: 'home',
    featured: true,
    calculatorType: 'apartment',
  },
  {
    slug: 'uborka-posle-remonta',
    title: 'Уборка квартиры после ремонта в Москве',
    shortTitle: 'После ремонта',
    description: 'Удаление строительной пыли и послеремонтных загрязнений.',
    priceFrom: null,
    category: 'home',
    featured: true,
    calculatorType: 'apartment',
  },
  {
    slug: 'srochnaya-uborka',
    title: 'Срочная уборка квартиры в Москве',
    shortTitle: 'Срочная уборка',
    description: 'Проверка возможности ближайшего выезда после заявки.',
    priceFrom: null,
    category: 'home',
    featured: true,
    calculatorType: 'apartment',
  },
  {
    slug: 'regulyarnaya-uborka',
    title: 'Регулярная уборка квартиры по графику в Москве',
    shortTitle: 'Регулярная уборка',
    description: 'Поддерживающий клининг по согласованному расписанию.',
    priceFrom: null,
    category: 'home',
    featured: true,
    calculatorType: 'apartment',
  },
  {
    slug: 'uborka-domov',
    title: 'Уборка домов и коттеджей в Москве и Московской области',
    shortTitle: 'Уборка домов',
    description: 'Разовая, генеральная или регулярная уборка частных домов.',
    priceFrom: null,
    category: 'home',
    featured: true,
    calculatorType: 'house',
  },
  {
    slug: 'uborka-domov-posle-remonta',
    title: 'Уборка домов и коттеджей после ремонта',
    shortTitle: 'Дома после ремонта',
    description: 'Послестроительный клининг коттеджей, дач и таунхаусов.',
    priceFrom: null,
    category: 'home',
    featured: false,
    calculatorType: 'house',
  },
  {
    slug: 'uborka-premialnyh-kvartir',
    title: 'Уборка премиальных квартир в Москве',
    shortTitle: 'Премиальные квартиры',
    description: 'Деликатная уборка квартир с дорогой отделкой и мебелью.',
    priceFrom: null,
    category: 'home',
    featured: false,
    calculatorType: 'apartment',
  },
  {
    slug: 'moyka-vitrin-i-fasadnogo-ostekleniya',
    title: 'Мытьё витрин и фасадного остекления в Москве',
    shortTitle: 'Мытьё витрин',
    description: 'Мытьё витрин, фасадного остекления и стеклянных конструкций.',
    priceFrom: null,
    category: 'business',
    featured: true,
    calculatorType: 'glass',
  },
  {
    slug: 'uborka-ofisov',
    title: 'Уборка офисов в Москве',
    shortTitle: 'Уборка офисов',
    description: 'Разовый и регулярный клининг офисных помещений.',
    priceFrom: null,
    category: 'business',
    featured: true,
    calculatorType: 'business',
  },
  {
    slug: 'uborka-magazinov',
    title: 'Уборка магазинов и торговых помещений в Москве',
    shortTitle: 'Магазины',
    description: 'Клининг торговых залов, примерочных и подсобных помещений.',
    priceFrom: null,
    category: 'business',
    featured: true,
    calculatorType: 'business',
  },
  {
    slug: 'uborka-kafe-i-restoranov',
    title: 'Уборка кафе и ресторанов в Москве',
    shortTitle: 'Кафе и рестораны',
    description: 'Уборка гостевых залов, санузлов и служебных помещений.',
    priceFrom: null,
    category: 'business',
    featured: false,
    calculatorType: 'business',
  },
  {
    slug: 'uborka-salonov-krasoty',
    title: 'Уборка салонов красоты и бьюти-студий в Москве',
    shortTitle: 'Салоны красоты',
    description: 'Клининг салонов, студий, парикмахерских и барбершопов.',
    priceFrom: null,
    category: 'business',
    featured: false,
    calculatorType: 'business',
  },
  {
    slug: 'uborka-sportivnyh-zalov',
    title: 'Уборка спортивных залов и фитнес-клубов в Москве',
    shortTitle: 'Спортивные залы',
    description: 'Уборка спортивных залов, раздевалок и душевых зон.',
    priceFrom: null,
    category: 'business',
    featured: false,
    calculatorType: 'business',
  },
];

export const getServiceBySlug = (slug: string) => services.find((service) => service.slug === slug);
export const featuredServices = services.filter((service) => service.featured);
export const homeServices = services.filter((service) => service.category === 'home');
export const businessServices = services.filter((service) => service.category === 'business');
