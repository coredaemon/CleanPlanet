import { pricing, pricesConfirmed } from '@/data/prices';

export interface CalculatorInput {
  objectType: string;
  cleaningType: string;
  rooms: number;
  area: number;
  bathrooms: number;
  additionalServices: string[];
  pollutionLevel: string;
  urgency: string;
  outsideMkad: boolean;
}

export interface CalculatorResult {
  pricesConfirmed: boolean;
  label: string;
  summary: string[];
  amountFrom: number | null;
}

export const defaultCalculatorInput: CalculatorInput = {
  objectType: 'Квартира',
  cleaningType: 'Поддерживающая',
  rooms: 2,
  area: 45,
  bathrooms: 1,
  additionalServices: [],
  pollutionLevel: 'Обычное состояние',
  urgency: 'Планово',
  outsideMkad: false,
};

// ₽ за м² для выбранного объекта и вида уборки; null = индивидуально
export function ratePerSqm(objectType: string, cleaningType: string): number | null {
  if (objectType === 'Дом или коттедж') return null;
  if (objectType === 'Офис' || objectType === 'Коммерческое помещение')
    return pricing.commercialRate;
  return pricing.ratesByType[cleaningType] ?? null;
}

export function calculateCleaning(input: CalculatorInput): CalculatorResult {
  const fixedExtras = input.additionalServices.reduce(
    (sum, service) => sum + (pricing.fixedAdditionalServices[service] ?? 0),
    0,
  );
  const needsIndividualCalculation =
    input.objectType === 'Дом или коттедж' ||
    input.cleaningType === 'После ремонта' ||
    input.pollutionLevel === 'Сильное загрязнение' ||
    input.outsideMkad ||
    input.additionalServices.some((service) =>
      pricing.individualAdditionalServices.includes(service),
    );

  const summary = [
    `${input.objectType}, ${input.cleaningType.toLowerCase()} уборка`,
    `${input.area} м², комнат: ${input.rooms}, санузлов: ${input.bathrooms}`,
    input.additionalServices.length
      ? `Дополнительно: ${input.additionalServices.join(', ')}`
      : 'Дополнительные услуги не выбраны',
    `Состояние: ${input.pollutionLevel}`,
    input.outsideMkad ? 'Адрес за МКАД' : 'Москва или ближайшая зона',
    `Срочность: ${input.urgency}`,
    fixedExtras ? `Фиксированные допработы: от ${fixedExtras.toLocaleString('ru-RU')} ₽` : '',
  ];

  const rate = ratePerSqm(input.objectType, input.cleaningType);
  if (!pricesConfirmed || rate === null || !input.area || needsIndividualCalculation) {
    return {
      pricesConfirmed,
      label: 'Предварительная стоимость рассчитывается индивидуально',
      summary: summary.filter(Boolean),
      amountFrom: null,
    };
  }

  const amountFrom =
    Math.max(Math.round((input.area * rate) / 100) * 100, pricing.minOrder) + fixedExtras;
  return {
    pricesConfirmed,
    label: `Предварительная стоимость от ${amountFrom.toLocaleString('ru-RU')} ₽`,
    summary: summary.filter(Boolean),
    amountFrom,
  };
}
