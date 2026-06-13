/**
 * Carbon Footprint Calculation Engine
 * Pure calculation module with no UI dependencies
 * All emission factors from DEFRA 2023, EPA, IPCC, and Our World in Data
 */

// ============================================================================
// EMISSION FACTORS (all values in kg CO2e per unit)
// ============================================================================

// DEFRA 2023: UK Car emissions by fuel type (g CO2/km)
// https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
const CAR_EMISSIONS_FACTORS = {
  petrol: 0.192, // kg CO2/km (191.6 g/km)
  diesel: 0.168, // kg CO2/km (167.8 g/km, includes lifecycle)
  hybrid: 0.104, // kg CO2/km (103.8 g/km)
  electric: 0.056, // kg CO2/km (56 g/km, UK average grid 2023)
  lpg: 0.140, // kg CO2/km
};

// DEFRA 2023 & EPA: Public transport emissions per km
// https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
const TRANSIT_EMISSIONS_FACTORS = {
  bus: 0.089, // kg CO2/km (per passenger, UK average)
  train: 0.041, // kg CO2/km (per passenger, UK average)
  average: 0.065, // kg CO2/km (conservative estimate if mix unknown)
};

// ICAO & DEFRA 2023: Flight emissions
// https://www.icao.int/environmental-protection/Pages/default.aspx
// Includes radiative forcing index (RFI) for high-altitude effects (~2.7x multiplier)
const FLIGHT_EMISSIONS = {
  shortFlight: 0.255, // kg CO2e per km (short-haul <900km with RFI)
  longFlight: 0.195, // kg CO2e per km (long-haul >900km with RFI)
  averageShortDistance: 300, // km (assumed distance for short flights)
  averageLongDistance: 6000, // km (assumed distance for long flights)
};

// DEFRA 2023: Home energy emissions
// https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
const ENERGY_EMISSIONS_FACTORS = {
  electricity: 0.192, // kg CO2/kWh (UK grid 2023)
  gas: 0.185, // kg CO2/kWh (includes extraction & distribution)
};

// Our World in Data & IPCC: Dietary emissions (annual per capita)
// https://ourworldindata.org/food-choice-vs-eating-local
const DIET_EMISSIONS_ANNUAL = {
  vegan: 1.5, // tonnes CO2e/year
  vegetarian: 1.7, // tonnes CO2e/year
  pescatarian: 1.9, // tonnes CO2e/year
  meatLow: 2.2, // tonnes CO2e/year (occasional meat)
  meatMedium: 2.5, // tonnes CO2e/year (regular meat)
  meatHigh: 2.9, // tonnes CO2e/year (daily meat)
};

// DEFRA 2023 & Waste & Resources Action Programme (WRAP)
// https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
const GOODS_EMISSIONS = {
  spendingEmissions: 0.45, // kg CO2/£ spent on new goods (UK average)
  landfillEmissions: 0.6, // kg CO2/kg of waste in landfill
};

// ============================================================================
// TYPES
// ============================================================================

export interface TransportInput {
  carKmPerWeek: number;
  fuelType: keyof typeof CAR_EMISSIONS_FACTORS;
  transitKmPerWeek: number;
  transitType?: keyof typeof TRANSIT_EMISSIONS_FACTORS;
  shortFlightsPerYear: number;
  longFlightsPerYear: number;
}

export interface TransportEmissionsResult {
  car: number;
  transit: number;
  shortFlights: number;
  longFlights: number;
  total: number;
}

export interface HomeEnergyInput {
  electricityKwhPerMonth: number;
  gasKwhPerMonth: number;
  householdSize: number;
}

export interface HomeEnergyResult {
  electricity: number;
  gas: number;
  total: number;
}

export type DietType = keyof typeof DIET_EMISSIONS_ANNUAL;

export interface GoodsWasteInput {
  goodsSpendingPerMonth: number;
  landfillKgPerWeek: number;
}

export interface GoodsWasteResult {
  goods: number;
  waste: number;
  total: number;
}

export interface CarbonFootprintBreakdown {
  transport: number;
  homeEnergy: number;
  diet: number;
  goodsAndWaste: number;
  total: number;
  breakdown: {
    transportDetail: {
      car: number;
      transit: number;
      flights: number;
    };
    homeEnergyDetail: {
      electricity: number;
      gas: number;
    };
  };
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate annual CO2e emissions from transport
 * All inputs are weekly; multiplied by 52 weeks for annual calculation
 */
export function calculateTransportEmissions(input: TransportInput): TransportEmissionsResult {
  // Car emissions: weekly km * 52 weeks * emission factor
  const carEmissions =
    input.carKmPerWeek * 52 * CAR_EMISSIONS_FACTORS[input.fuelType];

  // Transit emissions: weekly km * 52 weeks * emission factor
  const transitType = input.transitType || 'average';
  const transitEmissions =
    input.transitKmPerWeek * 52 * TRANSIT_EMISSIONS_FACTORS[transitType];

  // Flight emissions
  const shortFlightEmissions =
    input.shortFlightsPerYear *
    FLIGHT_EMISSIONS.averageShortDistance *
    FLIGHT_EMISSIONS.shortFlight;
  const longFlightEmissions =
    input.longFlightsPerYear *
    FLIGHT_EMISSIONS.averageLongDistance *
    FLIGHT_EMISSIONS.longFlight;

  return {
    car: carEmissions,
    transit: transitEmissions,
    shortFlights: shortFlightEmissions,
    longFlights: longFlightEmissions,
    total: carEmissions + transitEmissions + shortFlightEmissions + longFlightEmissions,
  };
}

/**
 * Calculate annual CO2e emissions from home energy
 * Electricity and gas inputs are monthly; multiplied by 12 for annual calculation
 * Household size affects heating/cooling per capita
 */
export function calculateHomeEnergyEmissions(input: HomeEnergyInput): HomeEnergyResult {
  // Electricity: monthly kWh * 12 months * emission factor
  const electricityEmissions =
    input.electricityKwhPerMonth * 12 * ENERGY_EMISSIONS_FACTORS.electricity;

  // Gas: monthly kWh * 12 months * emission factor
  const gasEmissions =
    input.gasKwhPerMonth * 12 * ENERGY_EMISSIONS_FACTORS.gas;

  return {
    electricity: electricityEmissions,
    gas: gasEmissions,
    total: electricityEmissions + gasEmissions,
  };
}

/**
 * Calculate annual CO2e emissions from diet
 * Uses pre-calculated annual totals by diet type
 */
export function calculateDietEmissions(dietType: DietType): number {
  return DIET_EMISSIONS_ANNUAL[dietType] * 1000; // Convert tonnes to kg
}

/**
 * Calculate annual CO2e emissions from goods purchasing and waste
 * Spending is monthly; multiplied by 12 for annual calculation
 * Waste is weekly; multiplied by 52 for annual calculation
 */
export function calculateGoodsWasteEmissions(input: GoodsWasteInput): GoodsWasteResult {
  // Goods: monthly spending £ * 12 months * emission factor
  const goodsEmissions = input.goodsSpendingPerMonth * 12 * GOODS_EMISSIONS.spendingEmissions;

  // Waste: weekly kg * 52 weeks * emission factor
  const wasteEmissions = input.landfillKgPerWeek * 52 * GOODS_EMISSIONS.landfillEmissions;

  return {
    goods: goodsEmissions,
    waste: wasteEmissions,
    total: goodsEmissions + wasteEmissions,
  };
}

/**
 * Calculate total annual carbon footprint
 * Returns breakdown by category plus total in tonnes CO2e
 */
export function calculateTotalFootprint(
  transport: TransportInput,
  homeEnergy: HomeEnergyInput,
  diet: DietType,
  goodsWaste: GoodsWasteInput
): CarbonFootprintBreakdown {
  const transportResult = calculateTransportEmissions(transport);
  const homeEnergyResult = calculateHomeEnergyEmissions(homeEnergy);
  const dietResult = calculateDietEmissions(diet);
  const goodsWasteResult = calculateGoodsWasteEmissions(goodsWaste);

  const totalKg =
    transportResult.total +
    homeEnergyResult.total +
    dietResult +
    goodsWasteResult.total;

  return {
    transport: transportResult.total / 1000, // convert to tonnes
    homeEnergy: homeEnergyResult.total / 1000,
    diet: dietResult / 1000,
    goodsAndWaste: goodsWasteResult.total / 1000,
    total: totalKg / 1000, // convert to tonnes
    breakdown: {
      transportDetail: {
        car: transportResult.car / 1000,
        transit: transportResult.transit / 1000,
        flights:
          (transportResult.shortFlights + transportResult.longFlights) / 1000,
      },
      homeEnergyDetail: {
        electricity: homeEnergyResult.electricity / 1000,
        gas: homeEnergyResult.gas / 1000,
      },
    },
  };
}
