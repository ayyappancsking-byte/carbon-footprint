import type { DietType, GoodsWasteInput, HomeEnergyInput, TransportInput } from '../lib/carbonEngine'
import type { FormData, FormErrors, SectionKey } from './calculatorTypes'

export const DEFAULT_FORM_DATA: FormData = {
  carKmPerWeek: 0,
  carFuelType: 'petrol',
  transitKmPerWeek: 0,
  shortFlightsPerYear: 0,
  longFlightsPerYear: 0,
  electricityKwhPerMonth: 0,
  gasKwhPerMonth: 0,
  householdSize: 1,
  diet: 'meatMedium',
  goodsSpendingPerMonth: 0,
  landfillKgPerWeek: 0,
}

export const DEFAULT_OPEN_SECTIONS = {
  transport: true,
  energy: true,
  diet: true,
} as const satisfies Record<SectionKey, boolean>

export const FIELD_RULES = {
  carKmPerWeek: { min: 0, max: 5000, message: 'Car distance must be between 0-5000 km/week' },
  transitKmPerWeek: { min: 0, max: 5000, message: 'Transit distance must be between 0-5000 km/week' },
  shortFlightsPerYear: { min: 0, max: 100, message: 'Short-haul flights must be between 0-100/year' },
  longFlightsPerYear: { min: 0, max: 100, message: 'Long-haul flights must be between 0-100/year' },
  electricityKwhPerMonth: { min: 0, max: 2000, message: 'Electricity must be between 0-2000 kWh/month' },
  gasKwhPerMonth: { min: 0, max: 2000, message: 'Gas must be between 0-2000 kWh/month' },
  householdSize: { min: 1, max: 20, message: 'Household size must be between 1-20' },
  goodsSpendingPerMonth: { min: 0, max: 10000, message: 'Goods spending must be between 0-10000/month' },
  landfillKgPerWeek: { min: 0, max: 200, message: 'Landfill waste must be between 0-200 kg/week' },
} as const

export const TOOLTIP_TEXTS: Record<string, string> = {
  carDistance: 'Average distance you drive per week. Include commute, shopping, leisure.',
  carFuel: 'Electric vehicles have the lowest emissions. Hybrids are a good middle ground.',
  transitDistance: 'Public transport per week (buses, trains, trams). Much lower emissions than cars.',
  shortFlights: 'Flights under 900km. Include return trips. Each flight is a significant emission event.',
  longFlights: 'Flights over 900km. Typically international. Long distances amplify impact.',
  electricity: 'Check your utility bills. UK average household uses about 250-350 kWh/month.',
  gas: 'Natural gas for heating and cooking. In kWh equivalents. UK average is about 40-60 kWh/month.',
  household: 'Number of people sharing energy use. Emissions are often divided per capita.',
  diet: 'Dietary choices have significant climate impact. Meat production is most carbon-intensive.',
  goods: 'Monthly spending on new clothes, electronics, furniture, and similar goods.',
  waste: 'Waste going to landfill per week in kg. Include general household waste.',
}

export type NumericFieldKey = keyof typeof FIELD_RULES

/**
 * Create a stable DOM id for a collapsible section.
 */
export function createSectionId(title: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-content`
}

/**
 * Determine whether a form key accepts numeric input.
 */
export function isNumericField(key: keyof FormData): key is NumericFieldKey {
  return key in FIELD_RULES
}

/**
 * Convert a text input into a numeric value or null if the input is invalid.
 */
export function parseNumericInput(value: string): number | null {
  if (value.trim() === '') {
    return 0
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Validate the calculator inputs and collect per-field errors.
 */
export function buildValidationErrors(formData: FormData): FormErrors {
  const errors: FormErrors = {}

  for (const [field, rule] of Object.entries(FIELD_RULES) as Array<
    [NumericFieldKey, (typeof FIELD_RULES)[NumericFieldKey]]
  >) {
    const value = formData[field]
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
      errors[field] = rule.message
    }
  }

  return errors
}

/**
 * Build an aria-describedby value that includes the field error when needed.
 */
export function getDescribedBy(fieldId: string, tooltipId: string, error?: string): string {
  return error ? `${tooltipId} ${fieldId}-error` : tooltipId
}

/**
 * Build the transport payload for the calculation engine.
 */
export function buildTransportInput(formData: FormData): TransportInput {
  return {
    carKmPerWeek: formData.carKmPerWeek,
    fuelType: formData.carFuelType,
    transitKmPerWeek: formData.transitKmPerWeek,
    shortFlightsPerYear: formData.shortFlightsPerYear,
    longFlightsPerYear: formData.longFlightsPerYear,
  }
}

/**
 * Build the home energy payload for the calculation engine.
 */
export function buildHomeEnergyInput(formData: FormData): HomeEnergyInput {
  return {
    electricityKwhPerMonth: formData.electricityKwhPerMonth,
    gasKwhPerMonth: formData.gasKwhPerMonth,
    householdSize: formData.householdSize,
  }
}

/**
 * Build the goods and waste payload for the calculation engine.
 */
export function buildGoodsWasteInput(formData: FormData): GoodsWasteInput {
  return {
    goodsSpendingPerMonth: formData.goodsSpendingPerMonth,
    landfillKgPerWeek: formData.landfillKgPerWeek,
  }
}

/**
 * Convert the UI diet selection into the engine diet type.
 */
export function buildDietType(formData: FormData): DietType {
  return formData.diet === 'pescatarian' ? formData.diet : (formData.diet as DietType)
}
