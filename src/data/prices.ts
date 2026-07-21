export const pricesConfirmed = false;

export const calculatorOptions = {
  objectTypes: ['Квартира', 'Дом или коттедж', 'Офис', 'Коммерческое помещение'],
  cleaningTypes: ['Поддерживающая', 'Генеральная', 'После ремонта', 'Срочная'],
  additionalServices: [
    'Мытьё окон',
    'Химчистка мебели',
    'Глажка',
    'Балкон или лоджия',
    'Духовка и холодильник',
  ],
  pollutionLevels: ['Обычное состояние', 'Сильное загрязнение', 'После ремонта'],
  urgency: ['Планово', 'В ближайшее время', 'Срочно'],
} as const;

export const tariffDraft = {
  basePerSquareMeter: 0,
  roomCoefficient: 0,
  bathroomCoefficient: 0,
  urgencyCoefficient: 0,
  outsideMkadCoefficient: 0,
} as const;
