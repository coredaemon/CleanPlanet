import { pricesConfirmed, tariffDraft } from '@/data/prices';

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

  if (!pricesConfirmed) {
    return {
      pricesConfirmed,
      label: 'Предварительная стоимость рассчитывается индивидуально',
      summary,
      amountFrom: null,
    };
  }

  const amountFrom =
    input.area * tariffDraft.basePerSquareMeter +
    input.rooms * tariffDraft.roomCoefficient +
    input.bathrooms * tariffDraft.bathroomCoefficient +
    (input.outsideMkad ? tariffDraft.outsideMkadCoefficient : 0);

  return {
    pricesConfirmed,
    label: `Предварительная стоимость от ${amountFrom.toLocaleString('ru-RU')} ₽`,
    summary,
    amountFrom,
  };
}
