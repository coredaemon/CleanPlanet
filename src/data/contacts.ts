export const contacts = {
  brand: 'CleanPlanet',
  region: 'Москва и ближайшее Подмосковье',
  phone: '+7 966 752-34-52',
  phoneHref: 'tel:+79667523452',
  whatsapp: 'WhatsApp',
  whatsappHref: 'https://wa.me/79667523452',
  // MAX-мессенджер клиент тоже хочет показывать — нужна ссылка/ID (пока нет).
  workHours: 'Круглосуточно, без выходных',
  legalName: 'ИП Прокопьева Екатерина Григорьевна',
  inn: '772406153012',
  ogrnip: '319774600415292',
  // Банковские реквизиты (для договоров/счетов; публично можно не выводить).
  bank: {
    name: 'АО «ТБанк»',
    account: '40802810900001192780',
    bik: '044525974',
    corrAccount: '30101810145250000974',
    inn: '7710140679',
    address: '127287, г. Москва, ул. Хуторская 2-я, д. 38А, стр. 26',
  },
  analytics: {
    yandexMetrikaId: '',
    googleVerification: '',
    yandexWebmasterVerification: '',
  },
} as const;
