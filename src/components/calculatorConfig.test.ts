import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FORM_DATA,
  buildDietType,
  buildGoodsWasteInput,
  buildHomeEnergyInput,
  buildTransportInput,
  buildValidationErrors,
  createSectionId,
  getDescribedBy,
  isNumericField,
  parseNumericInput,
} from './calculatorConfig'
import type { FormData } from './calculatorTypes'

describe('calculatorConfig', () => {
  it('creates stable section ids and detects numeric fields', () => {
    expect(createSectionId('Diet & Consumption')).toBe('diet-consumption-content')
    expect(isNumericField('carKmPerWeek')).toBe(true)
    expect(isNumericField('diet')).toBe(false)
  })

  it('parses numeric input and builds described-by ids', () => {
    expect(parseNumericInput('')).toBe(0)
    expect(parseNumericInput(' 42.5 ')).toBe(42.5)
    expect(parseNumericInput('abc')).toBeNull()
    expect(getDescribedBy('field', 'tooltip')).toBe('tooltip')
    expect(getDescribedBy('field', 'tooltip', 'Problem')).toBe('tooltip field-error')
  })

  it('builds validation errors for invalid calculator input', () => {
    const invalidData: FormData = {
      ...DEFAULT_FORM_DATA,
      carKmPerWeek: -1,
      transitKmPerWeek: Number.NaN,
      householdSize: 0,
      goodsSpendingPerMonth: 10001,
    }

    expect(buildValidationErrors(invalidData)).toEqual(
      expect.objectContaining({
        carKmPerWeek: 'Car distance must be between 0-5000 km/week',
        transitKmPerWeek: 'Transit distance must be between 0-5000 km/week',
        householdSize: 'Household size must be between 1-20',
        goodsSpendingPerMonth: 'Goods spending must be between 0-10000/month',
      }),
    )
  })

  it('builds the calculation engine payloads and diet type', () => {
    const formData: FormData = {
      ...DEFAULT_FORM_DATA,
      carKmPerWeek: 120,
      carFuelType: 'diesel',
      transitKmPerWeek: 35,
      shortFlightsPerYear: 3,
      longFlightsPerYear: 1,
      electricityKwhPerMonth: 220,
      gasKwhPerMonth: 45,
      householdSize: 2,
      diet: 'pescatarian',
      goodsSpendingPerMonth: 180,
      landfillKgPerWeek: 9,
    }

    expect(buildTransportInput(formData)).toEqual({
      carKmPerWeek: 120,
      fuelType: 'diesel',
      transitKmPerWeek: 35,
      shortFlightsPerYear: 3,
      longFlightsPerYear: 1,
    })
    expect(buildHomeEnergyInput(formData)).toEqual({
      electricityKwhPerMonth: 220,
      gasKwhPerMonth: 45,
      householdSize: 2,
    })
    expect(buildGoodsWasteInput(formData)).toEqual({
      goodsSpendingPerMonth: 180,
      landfillKgPerWeek: 9,
    })
    expect(buildDietType(formData)).toBe('pescatarian')
    expect(buildDietType({ ...formData, diet: 'meatHigh' })).toBe('meatHigh')
  })
})
