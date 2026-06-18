import { describe, it, expect } from 'vitest'
import {
  calculateTransportEmissions,
  calculateHomeEnergyEmissions,
  calculateDietEmissions,
  calculateGoodsWasteEmissions,
  calculateTotalFootprint,
  type TransportInput,
  type HomeEnergyInput,
  type GoodsWasteInput,
  type DietType,
} from './carbonEngine'

describe('Carbon Calculation Engine', () => {
  it('calculates petrol car emissions correctly', () => {
    const input: TransportInput = {
      carKmPerWeek: 50,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    }

    const result = calculateTransportEmissions(input)
    expect(result.car).toBeCloseTo(499.2, 1)
    expect(result.transit).toBeCloseTo(0, 1)
    expect(result.total).toBeCloseTo(499.2, 1)
  })

  it('calculates electric car emissions correctly', () => {
    const input: TransportInput = {
      carKmPerWeek: 50,
      fuelType: 'electric',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    }

    const result = calculateTransportEmissions(input)
    expect(result.car).toBeCloseTo(145.6, 1)
    expect(result.car).toBeLessThan(499.2 * 0.35)
  })

  it('calculates transit emissions correctly', () => {
    const input: TransportInput = {
      carKmPerWeek: 0,
      fuelType: 'petrol',
      transitKmPerWeek: 30,
      transitType: 'average',
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    }

    const result = calculateTransportEmissions(input)
    expect(result.transit).toBeCloseTo(101.4, 1)
  })

  it('calculates flight emissions with short and long flights', () => {
    const input: TransportInput = {
      carKmPerWeek: 0,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 2,
      longFlightsPerYear: 1,
    }

    const result = calculateTransportEmissions(input)
    expect(result.shortFlights).toBeCloseTo(153, 0)
    expect(result.longFlights).toBeCloseTo(1170, 0)
    expect(result.total).toBeCloseTo(1323, 0)
  })

  it('calculates home energy emissions correctly', () => {
    const input: HomeEnergyInput = {
      electricityKwhPerMonth: 300,
      gasKwhPerMonth: 100,
      householdSize: 2,
    }

    const result = calculateHomeEnergyEmissions(input)
    expect(result.electricity).toBeCloseTo(345.6, 1)
    expect(result.gas).toBeCloseTo(111, 1)
    expect(result.total).toBeCloseTo(456.6, 1)
  })

  it('calculates diet emissions by diet type', () => {
    const veganResult = calculateDietEmissions('vegan')
    const vegetarianResult = calculateDietEmissions('vegetarian')
    const meatHighResult = calculateDietEmissions('meatHigh')

    expect(veganResult).toBeCloseTo(1500, 0)
    expect(vegetarianResult).toBeCloseTo(1700, 0)
    expect(meatHighResult).toBeCloseTo(2900, 0)

    expect(veganResult).toBeLessThan(vegetarianResult)
    expect(vegetarianResult).toBeLessThan(meatHighResult)
  })

  it('calculates goods and waste emissions correctly', () => {
    const input: GoodsWasteInput = {
      goodsSpendingPerMonth: 100,
      landfillKgPerWeek: 5,
    }

    const result = calculateGoodsWasteEmissions(input)
    expect(result.goods).toBeCloseTo(540, 1)
    expect(result.waste).toBeCloseTo(156, 1)
    expect(result.total).toBeCloseTo(696, 1)
  })

  it('calculates total footprint correctly', () => {
    const transport: TransportInput = {
      carKmPerWeek: 40,
      fuelType: 'hybrid',
      transitKmPerWeek: 20,
      transitType: 'average',
      shortFlightsPerYear: 1,
      longFlightsPerYear: 0,
    }

    const homeEnergy: HomeEnergyInput = {
      electricityKwhPerMonth: 250,
      gasKwhPerMonth: 80,
      householdSize: 2,
    }

    const goods: GoodsWasteInput = {
      goodsSpendingPerMonth: 80,
      landfillKgPerWeek: 3,
    }

    const result = calculateTotalFootprint(transport, homeEnergy, 'vegetarian', goods)

    expect(result.breakdown).toBeDefined()
    expect(result.breakdown.transportDetail).toBeDefined()
    expect(result.breakdown.homeEnergyDetail).toBeDefined()
    expect(result.total).toBeCloseTo(result.transport + result.homeEnergy + result.diet + result.goodsAndWaste, 2)
    expect(result.total).toBeGreaterThan(0)
    expect(result.transport).toBeGreaterThan(0)
    expect(result.homeEnergy).toBeGreaterThan(0)
    expect(result.diet).toBeGreaterThan(0)
    expect(result.goodsAndWaste).toBeGreaterThan(0)
  })

  it('correctly multiplies weekly and monthly inputs to annual values', () => {
    const weeklyTransport: TransportInput = {
      carKmPerWeek: 1,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    }
    const transportResult = calculateTransportEmissions(weeklyTransport)
    expect(transportResult.car).toBeCloseTo(1 * 52 * 0.192, 3)

    const monthlyEnergy: HomeEnergyInput = {
      electricityKwhPerMonth: 1,
      gasKwhPerMonth: 0,
      householdSize: 1,
    }
    const energyResult = calculateHomeEnergyEmissions(monthlyEnergy)
    expect(energyResult.electricity).toBeCloseTo(1 * 12 * 0.192, 3)
  })

  it('handles zero inputs gracefully', () => {
    const zeroTransport: TransportInput = {
      carKmPerWeek: 0,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    }
    const zeroEnergy: HomeEnergyInput = {
      electricityKwhPerMonth: 0,
      gasKwhPerMonth: 0,
      householdSize: 1,
    }
    const zeroGoods: GoodsWasteInput = {
      goodsSpendingPerMonth: 0,
      landfillKgPerWeek: 0,
    }

    const transport = calculateTransportEmissions(zeroTransport)
    const energy = calculateHomeEnergyEmissions(zeroEnergy)
    const goods = calculateGoodsWasteEmissions(zeroGoods)

    expect(transport.total).toBe(0)
    expect(energy.total).toBe(0)
    expect(goods.total).toBe(0)

    const result = calculateTotalFootprint(zeroTransport, zeroEnergy, 'vegan', zeroGoods)
    expect(result.total).toBe(result.diet)
    expect(result.transport).toBe(0)
    expect(result.homeEnergy).toBe(0)
    expect(result.goodsAndWaste).toBe(0)
  })

  it('uses fallback emission factors for unknown transport types', () => {
    const input = {
      carKmPerWeek: 10,
      fuelType: 'spaceship',
      transitKmPerWeek: 10,
      transitType: 'ferry',
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    } as unknown as TransportInput

    const result = calculateTransportEmissions(input)

    expect(result.car).toBeCloseTo(10 * 52 * 0.192, 2)
    expect(result.transit).toBeCloseTo(10 * 52 * 0.065, 2)
    expect(result.total).toBeCloseTo(result.car + result.transit, 2)
  })

  it('clamps negative and NaN transport inputs to zero', () => {
    const input: TransportInput = {
      carKmPerWeek: Number.NaN,
      fuelType: 'petrol',
      transitKmPerWeek: -5,
      shortFlightsPerYear: -1,
      longFlightsPerYear: Number.NaN,
    }

    const result = calculateTransportEmissions(input)

    expect(result.car).toBe(0)
    expect(result.transit).toBe(0)
    expect(result.shortFlights).toBe(0)
    expect(result.longFlights).toBe(0)
    expect(result.total).toBe(0)
  })

  it('clamps invalid household size and NaN energy inputs', () => {
    const input: HomeEnergyInput = {
      electricityKwhPerMonth: 1,
      gasKwhPerMonth: Number.NaN,
      householdSize: 0,
    }

    const result = calculateHomeEnergyEmissions(input)

    expect(result.electricity).toBeCloseTo(2.304, 3)
    expect(result.gas).toBe(0)
    expect(result.total).toBeCloseTo(2.304, 3)
  })

  it('clamps negative and NaN goods and waste inputs to zero', () => {
    const input: GoodsWasteInput = {
      goodsSpendingPerMonth: -50,
      landfillKgPerWeek: Number.NaN,
    }

    const result = calculateGoodsWasteEmissions(input)

    expect(result.goods).toBe(0)
    expect(result.waste).toBe(0)
    expect(result.total).toBe(0)
  })

  it('falls back to vegan emissions for invalid diet values', () => {
    const result = calculateDietEmissions('not-a-diet' as DietType)

    expect(result).toBeCloseTo(1500, 0)
  })

  it('keeps total footprint finite when supplied with invalid values', () => {
    const transport = {
      carKmPerWeek: 10,
      fuelType: 'spaceship',
      transitKmPerWeek: 10,
      transitType: 'ferry',
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    } as unknown as TransportInput
    const homeEnergy = {
      electricityKwhPerMonth: Number.NaN,
      gasKwhPerMonth: -50,
      householdSize: 0,
    } as HomeEnergyInput
    const goods = {
      goodsSpendingPerMonth: Number.NaN,
      landfillKgPerWeek: -1,
    } as GoodsWasteInput

    const result = calculateTotalFootprint(transport, homeEnergy, 'not-a-diet' as DietType, goods)

    expect(Number.isFinite(result.total)).toBe(true)
    expect(result.total).toBeGreaterThan(0)
    expect(result.transport).toBeGreaterThan(0)
    expect(result.homeEnergy).toBe(0)
    expect(result.diet).toBeCloseTo(1.5, 1)
    expect(result.goodsAndWaste).toBe(0)
  })
})
