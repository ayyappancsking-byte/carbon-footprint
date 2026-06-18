/**
 * Carbon Footprint Calculation Engine.
 * Pure calculation module with no UI dependencies.
 * All emission factors come from DEFRA 2023, EPA, IPCC, and Our World in Data.
 */

import { MONTHS_PER_YEAR, WEEKS_PER_YEAR } from '../constants/thresholds'

// ============================================================================
// EMISSION FACTORS (all values in kg CO2e per unit)
// ============================================================================

const CAR_EMISSIONS_FACTORS = {
  petrol: 0.192,
  diesel: 0.168,
  hybrid: 0.104,
  electric: 0.056,
  lpg: 0.14,
}

const TRANSIT_EMISSIONS_FACTORS = {
  bus: 0.089,
  train: 0.041,
  average: 0.065,
}

const FLIGHT_EMISSIONS = {
  shortFlight: 0.255,
  longFlight: 0.195,
  averageShortDistance: 300,
  averageLongDistance: 6000,
}

const ENERGY_EMISSIONS_FACTORS = {
  electricity: 0.192,
  gas: 0.185,
}

const DIET_EMISSIONS_ANNUAL = {
  vegan: 1.5,
  vegetarian: 1.7,
  pescatarian: 1.9,
  meatLow: 2.2,
  meatMedium: 2.5,
  meatHigh: 2.9,
}

const GOODS_EMISSIONS = {
  spendingEmissions: 0.45,
  landfillEmissions: 0.6,
}

// ============================================================================
// TYPES
// ============================================================================

export interface TransportInput {
  carKmPerWeek: number
  fuelType: keyof typeof CAR_EMISSIONS_FACTORS
  transitKmPerWeek: number
  transitType?: keyof typeof TRANSIT_EMISSIONS_FACTORS
  shortFlightsPerYear: number
  longFlightsPerYear: number
}

export interface TransportEmissionsResult {
  car: number
  transit: number
  shortFlights: number
  longFlights: number
  total: number
}

export interface HomeEnergyInput {
  electricityKwhPerMonth: number
  gasKwhPerMonth: number
  householdSize: number
}

export interface HomeEnergyResult {
  electricity: number
  gas: number
  total: number
}

export type DietType = keyof typeof DIET_EMISSIONS_ANNUAL

export interface GoodsWasteInput {
  goodsSpendingPerMonth: number
  landfillKgPerWeek: number
}

export interface GoodsWasteResult {
  goods: number
  waste: number
  total: number
}

export interface CarbonFootprintBreakdown {
  transport: number
  homeEnergy: number
  diet: number
  goodsAndWaste: number
  total: number
  breakdown: {
    transportDetail: {
      car: number
      transit: number
      flights: number
    }
    homeEnergyDetail: {
      electricity: number
      gas: number
    }
  }
}

/**
 * Normalise a numeric input so invalid, negative, and infinite values become zero.
 */
function normalizeNonNegativeNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * Convert a kilogram total to tonnes.
 */
function convertKilogramsToTonnes(value: number): number {
  return value / 1000
}

/**
 * Convert tonnes to kilograms.
 */
function convertTonnesToKilograms(value: number): number {
  return value * 1000
}

/**
 * Look up a factor and fall back to a safe default if the key is missing.
 */
function getEmissionFactor<T extends Record<string, number>>(
  factors: T,
  key: keyof T,
  fallbackKey: keyof T,
): number {
  return factors[key] ?? factors[fallbackKey]
}

/**
 * Calculate kilograms of CO2e from a weekly distance input.
 */
function calculateWeeklyDistanceEmissions(distancePerWeek: number, emissionFactor: number): number {
  return normalizeNonNegativeNumber(distancePerWeek) * WEEKS_PER_YEAR * emissionFactor
}

/**
 * Calculate kilograms of CO2e from an annual trips input.
 */
function calculateAnnualTripEmissions(
  tripsPerYear: number,
  averageDistanceKm: number,
  emissionFactor: number,
): number {
  return normalizeNonNegativeNumber(tripsPerYear) * averageDistanceKm * emissionFactor
}

/**
 * Convert kilogram-level transport results into tonne-level breakdown values.
 */
function buildTonnesBreakdown(result: {
  transport: TransportEmissionsResult
  homeEnergy: HomeEnergyResult
  dietKg: number
  goodsWaste: GoodsWasteResult
}): CarbonFootprintBreakdown {
  const totalKg =
    result.transport.total +
    result.homeEnergy.total +
    result.dietKg +
    result.goodsWaste.total

  return {
    transport: convertKilogramsToTonnes(result.transport.total),
    homeEnergy: convertKilogramsToTonnes(result.homeEnergy.total),
    diet: convertKilogramsToTonnes(result.dietKg),
    goodsAndWaste: convertKilogramsToTonnes(result.goodsWaste.total),
    total: convertKilogramsToTonnes(totalKg),
    breakdown: {
      transportDetail: {
        car: convertKilogramsToTonnes(result.transport.car),
        transit: convertKilogramsToTonnes(result.transport.transit),
        flights: convertKilogramsToTonnes(
          result.transport.shortFlights + result.transport.longFlights,
        ),
      },
      homeEnergyDetail: {
        electricity: convertKilogramsToTonnes(result.homeEnergy.electricity),
        gas: convertKilogramsToTonnes(result.homeEnergy.gas),
      },
    },
  }
}

/**
 * Calculate annual CO2e emissions from transport.
 * Weekly inputs are multiplied by 52, while flights are already annual counts.
 */
export function calculateTransportEmissions(input: TransportInput): TransportEmissionsResult {
  const carEmissions = calculateWeeklyDistanceEmissions(
    input.carKmPerWeek,
    getEmissionFactor(CAR_EMISSIONS_FACTORS, input.fuelType, 'petrol'),
  )
  const transitType = input.transitType ?? 'average'
  const transitEmissions = calculateWeeklyDistanceEmissions(
    input.transitKmPerWeek,
    getEmissionFactor(TRANSIT_EMISSIONS_FACTORS, transitType, 'average'),
  )
  const shortFlightEmissions = calculateAnnualTripEmissions(
    input.shortFlightsPerYear,
    FLIGHT_EMISSIONS.averageShortDistance,
    FLIGHT_EMISSIONS.shortFlight,
  )
  const longFlightEmissions = calculateAnnualTripEmissions(
    input.longFlightsPerYear,
    FLIGHT_EMISSIONS.averageLongDistance,
    FLIGHT_EMISSIONS.longFlight,
  )

  return {
    car: carEmissions,
    transit: transitEmissions,
    shortFlights: shortFlightEmissions,
    longFlights: longFlightEmissions,
    total: carEmissions + transitEmissions + shortFlightEmissions + longFlightEmissions,
  }
}

/**
 * Calculate annual CO2e emissions from home energy.
 * Monthly electricity and gas usage are annualised and divided by household size.
 */
export function calculateHomeEnergyEmissions(input: HomeEnergyInput): HomeEnergyResult {
  const householdSize = Math.max(1, normalizeNonNegativeNumber(input.householdSize))
  const electricityEmissions =
    (normalizeNonNegativeNumber(input.electricityKwhPerMonth) *
      MONTHS_PER_YEAR *
      ENERGY_EMISSIONS_FACTORS.electricity) /
    householdSize
  const gasEmissions =
    (normalizeNonNegativeNumber(input.gasKwhPerMonth) *
      MONTHS_PER_YEAR *
      ENERGY_EMISSIONS_FACTORS.gas) /
    householdSize

  return {
    electricity: electricityEmissions,
    gas: gasEmissions,
    total: electricityEmissions + gasEmissions,
  }
}

/**
 * Calculate annual CO2e emissions from diet.
 * The source values are stored in tonnes, so they are converted to kilograms.
 */
export function calculateDietEmissions(dietType: DietType): number {
  const annualTonnes = getEmissionFactor(DIET_EMISSIONS_ANNUAL, dietType, 'vegan')
  return convertTonnesToKilograms(annualTonnes)
}

/**
 * Calculate annual CO2e emissions from goods purchasing and waste.
 * Monthly spending is annualised, and weekly landfill waste is annualised.
 */
export function calculateGoodsWasteEmissions(input: GoodsWasteInput): GoodsWasteResult {
  const goodsEmissions =
    normalizeNonNegativeNumber(input.goodsSpendingPerMonth) *
    MONTHS_PER_YEAR *
    GOODS_EMISSIONS.spendingEmissions
  const wasteEmissions =
    normalizeNonNegativeNumber(input.landfillKgPerWeek) *
    WEEKS_PER_YEAR *
    GOODS_EMISSIONS.landfillEmissions

  return {
    goods: goodsEmissions,
    waste: wasteEmissions,
    total: goodsEmissions + wasteEmissions,
  }
}

/**
 * Calculate the total annual carbon footprint.
 * Returns category totals and a detailed kilogram-to-tonne breakdown.
 */
export function calculateTotalFootprint(
  transport: TransportInput,
  homeEnergy: HomeEnergyInput,
  diet: DietType,
  goodsWaste: GoodsWasteInput,
): CarbonFootprintBreakdown {
  const transportResult = calculateTransportEmissions(transport)
  const homeEnergyResult = calculateHomeEnergyEmissions(homeEnergy)
  const dietResult = calculateDietEmissions(diet)
  const goodsWasteResult = calculateGoodsWasteEmissions(goodsWaste)

  return buildTonnesBreakdown({
    transport: transportResult,
    homeEnergy: homeEnergyResult,
    dietKg: dietResult,
    goodsWaste: goodsWasteResult,
  })
}
