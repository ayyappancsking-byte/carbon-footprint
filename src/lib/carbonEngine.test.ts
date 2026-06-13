import { describe, it, expect } from 'vitest';
import {
  calculateTransportEmissions,
  calculateHomeEnergyEmissions,
  calculateDietEmissions,
  calculateGoodsWasteEmissions,
  calculateTotalFootprint,
  type TransportInput,
  type HomeEnergyInput,
  type GoodsWasteInput,
} from './carbonEngine';

describe('Carbon Calculation Engine', () => {
  /**
   * Test 1: Transport - Car emissions calculation with petrol
   * Input: 50 km/week petrol car, no transit, no flights
   * Expected: 50 * 52 weeks * 0.192 kg CO2/km = 499.2 kg CO2
   */
  it('should calculate petrol car emissions correctly', () => {
    const input: TransportInput = {
      carKmPerWeek: 50,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    };
    const result = calculateTransportEmissions(input);
    expect(result.car).toBeCloseTo(499.2, 1);
    expect(result.transit).toBeCloseTo(0, 1);
    expect(result.total).toBeCloseTo(499.2, 1);
  });

  /**
   * Test 2: Transport - Electric car significantly lower emissions
   * Input: 50 km/week electric car
   * Expected: 50 * 52 * 0.056 = 145.6 kg CO2 (much lower than petrol)
   */
  it('should calculate electric car emissions correctly', () => {
    const input: TransportInput = {
      carKmPerWeek: 50,
      fuelType: 'electric',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    };
    const result = calculateTransportEmissions(input);
    expect(result.car).toBeCloseTo(145.6, 1);
    // Verify it's ~70% lower than petrol equivalent
    expect(result.car).toBeLessThan(499.2 * 0.35);
  });

  /**
   * Test 3: Transport - Transit emissions (bus + train mix)
   * Input: 30 km/week transit (average 0.065 kg CO2/km)
   * Expected: 30 * 52 * 0.065 = 101.4 kg CO2
   */
  it('should calculate transit emissions correctly', () => {
    const input: TransportInput = {
      carKmPerWeek: 0,
      fuelType: 'petrol',
      transitKmPerWeek: 30,
      transitType: 'average',
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    };
    const result = calculateTransportEmissions(input);
    expect(result.transit).toBeCloseTo(101.4, 1);
  });

  /**
   * Test 4: Transport - Flights calculation
   * Input: 2 short flights (300km each @ 0.255 kg CO2/km), 1 long flight (6000km @ 0.195 kg CO2/km)
   * Expected short: 2 * 300 * 0.255 = 153 kg CO2
   * Expected long: 1 * 6000 * 0.195 = 1170 kg CO2
   * Total: 1323 kg CO2
   */
  it('should calculate flight emissions with short and long flights', () => {
    const input: TransportInput = {
      carKmPerWeek: 0,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 2,
      longFlightsPerYear: 1,
    };
    const result = calculateTransportEmissions(input);
    expect(result.shortFlights).toBeCloseTo(153, 0);
    expect(result.longFlights).toBeCloseTo(1170, 0);
    expect(result.total).toBeCloseTo(1323, 0);
  });

  /**
   * Test 5: Home Energy - Electricity and gas calculations
   * Input: 300 kWh/month electricity, 100 kWh/month gas
   * Electricity: 300 * 12 * 0.192 = 691.2 kg CO2
   * Gas: 100 * 12 * 0.185 = 222 kg CO2
   * Total: 913.2 kg CO2
   */
  it('should calculate home energy emissions correctly', () => {
    const input: HomeEnergyInput = {
      electricityKwhPerMonth: 300,
      gasKwhPerMonth: 100,
      householdSize: 2,
    };
    const result = calculateHomeEnergyEmissions(input);
    expect(result.electricity).toBeCloseTo(691.2, 1);
    expect(result.gas).toBeCloseTo(222, 1);
    expect(result.total).toBeCloseTo(913.2, 1);
  });

  /**
   * Test 6: Diet emissions by type
   * Vegan should be lowest, meat-heavy should be highest
   * Vegan: 1.5 tonnes = 1500 kg
   * Meat-high: 2.9 tonnes = 2900 kg
   */
  it('should calculate diet emissions by diet type', () => {
    const veganResult = calculateDietEmissions('vegan');
    const vegetarianResult = calculateDietEmissions('vegetarian');
    const meatHighResult = calculateDietEmissions('meatHigh');

    expect(veganResult).toBeCloseTo(1500, 0);
    expect(vegetarianResult).toBeCloseTo(1700, 0);
    expect(meatHighResult).toBeCloseTo(2900, 0);

    // Verify ordering
    expect(veganResult).toBeLessThan(vegetarianResult);
    expect(vegetarianResult).toBeLessThan(meatHighResult);
  });

  /**
   * Test 7: Goods and Waste emissions
   * Input: £100/month goods spending, 5 kg/week landfill waste
   * Goods: 100 * 12 * 0.45 = 540 kg CO2
   * Waste: 5 * 52 * 0.6 = 156 kg CO2
   * Total: 696 kg CO2
   */
  it('should calculate goods and waste emissions correctly', () => {
    const input: GoodsWasteInput = {
      goodsSpendingPerMonth: 100,
      landfillKgPerWeek: 5,
    };
    const result = calculateGoodsWasteEmissions(input);
    expect(result.goods).toBeCloseTo(540, 1);
    expect(result.waste).toBeCloseTo(156, 1);
    expect(result.total).toBeCloseTo(696, 1);
  });

  /**
   * Test 8: Total footprint calculation combines all categories
   * Moderate usage across all categories
   * Tests annual week/month multiplication is correct (52 weeks, 12 months)
   */
  it('should calculate total footprint correctly', () => {
    const transport: TransportInput = {
      carKmPerWeek: 40,
      fuelType: 'hybrid',
      transitKmPerWeek: 20,
      transitType: 'average',
      shortFlightsPerYear: 1,
      longFlightsPerYear: 0,
    };

    const homeEnergy: HomeEnergyInput = {
      electricityKwhPerMonth: 250,
      gasKwhPerMonth: 80,
      householdSize: 2,
    };

    const goods: GoodsWasteInput = {
      goodsSpendingPerMonth: 80,
      landfillKgPerWeek: 3,
    };

    const result = calculateTotalFootprint(transport, homeEnergy, 'vegetarian', goods);

    // Verify breakdown structure exists
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.transportDetail).toBeDefined();
    expect(result.breakdown.homeEnergyDetail).toBeDefined();

    // Verify totals match sum of components
    expect(result.total).toBeCloseTo(
      result.transport + result.homeEnergy + result.diet + result.goodsAndWaste,
      2
    );

    // Verify all values are in tonnes and positive
    expect(result.total).toBeGreaterThan(0);
    expect(result.transport).toBeGreaterThan(0);
    expect(result.homeEnergy).toBeGreaterThan(0);
    expect(result.diet).toBeGreaterThan(0);
    expect(result.goodsAndWaste).toBeGreaterThan(0);
  });

  /**
   * Test 9: Week and month to annual multiplication
   * Verifies the critical x52 weeks and x12 months conversions are correct
   * Using simple single-source values to isolate the math
   */
  it('should correctly multiply weekly and monthly inputs to annual', () => {
    // Test weekly: 1 km/week car driving for a year
    // 1 * 52 weeks * 0.192 = 9.984 kg CO2
    const weeklyTransport: TransportInput = {
      carKmPerWeek: 1,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    };
    const transportResult = calculateTransportEmissions(weeklyTransport);
    expect(transportResult.car).toBeCloseTo(1 * 52 * 0.192, 3);

    // Test monthly: 1 kWh/month electricity for a year
    // 1 * 12 months * 0.192 = 2.304 kg CO2
    const monthlyEnergy: HomeEnergyInput = {
      electricityKwhPerMonth: 1,
      gasKwhPerMonth: 0,
      householdSize: 1,
    };
    const energyResult = calculateHomeEnergyEmissions(monthlyEnergy);
    expect(energyResult.electricity).toBeCloseTo(1 * 12 * 0.192, 3);
  });

  /**
   * Test 10: Zero inputs produce zero or minimal emissions
   * Ensures no edge case bugs with zero values
   */
  it('should handle zero inputs gracefully', () => {
    const zeroTransport: TransportInput = {
      carKmPerWeek: 0,
      fuelType: 'petrol',
      transitKmPerWeek: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    };
    const zeroEnergy: HomeEnergyInput = {
      electricityKwhPerMonth: 0,
      gasKwhPerMonth: 0,
      householdSize: 1,
    };
    const zeroGoods: GoodsWasteInput = {
      goodsSpendingPerMonth: 0,
      landfillKgPerWeek: 0,
    };

    const transport = calculateTransportEmissions(zeroTransport);
    const energy = calculateHomeEnergyEmissions(zeroEnergy);
    const goods = calculateGoodsWasteEmissions(zeroGoods);

    expect(transport.total).toBe(0);
    expect(energy.total).toBe(0);
    expect(goods.total).toBe(0);

    // Total should still calculate with diet as minimum
    const result = calculateTotalFootprint(zeroTransport, zeroEnergy, 'vegan', zeroGoods);
    expect(result.total).toBe(result.diet); // Only diet contributes
    expect(result.transport).toBe(0);
    expect(result.homeEnergy).toBe(0);
    expect(result.goodsAndWaste).toBe(0);
  });
});
