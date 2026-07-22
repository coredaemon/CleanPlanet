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
  const summary = [
    `${input.objectType}, ${input.cleaningType.toLowerCase()} уборка`,
    `${input.area} м², комнат: ${input.rooms}, санузлов: ${input.bathrooms}`,
    input.additionalServices.length
      ? `Дополнительно: ${input.additionalServices.join(', ')}`
      : 'Дополнительные услуги не выбраны',
    `Состояние: ${input.pollutionLevel}`,
    input.outsideMkad ? 'Адрес за МКАД' : 'Москва или ближайшая зона',
    `Срочность: ${input.urgency}`,
  ];

  const rate = ratePerSqm(input.objectType, input.cleaningType);
  if (!pricesConfirmed || rate === null || !input.area) {
    return {
      pricesConfirmed,
      label: 'Предварительная стоимость рассчитывается индивидуально',
      summary,
      amountFrom: null,
    };
  }

  const amountFrom = Math.max(Math.round((input.area * rate) / 100) * 100, pricing.minOrder);
  return {
    pricesConfirmed,
    label: `Предварительная стоимость от ${amountFrom.toLocaleString('ru-RU')} ₽`,
    summary,
    amountFrom,
  };
}
