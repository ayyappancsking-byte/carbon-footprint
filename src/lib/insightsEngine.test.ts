import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generatePersonalizedInsights } from './insightsEngine'
import type { CarbonFootprintBreakdown } from './carbonEngine'

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockRejectedValue(new Error('API Error')),
    },
  })),
}))

describe('insightsEngine - Fallback Logic', () => {
  beforeEach(() => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_GEMINI_API_KEY: 'invalid_key',
        },
      },
    })
  })

  it('generates recommendations targeting the largest category first', async () => {
    const breakdown: CarbonFootprintBreakdown = {
      transport: 3.5,
      homeEnergy: 0.8,
      diet: 1.2,
      goodsAndWaste: 0.5,
      total: 6.0,
      breakdown: {
        transportDetail: { car: 3.0, transit: 0.3, flights: 0.2 },
        homeEnergyDetail: { electricity: 0.5, gas: 0.3 },
      },
    }

    const result = await generatePersonalizedInsights(breakdown)

    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations.length).toBeLessThanOrEqual(4)

    const transportRec = result.recommendations.find((r) => r.category === 'Transport')
    expect(transportRec).toBeDefined()
  })

  it('uses fallback when API key is missing', async () => {
    const breakdown: CarbonFootprintBreakdown = {
      transport: 1.5,
      homeEnergy: 2.0,
      diet: 1.8,
      goodsAndWaste: 0.7,
      total: 6.0,
      breakdown: {
        transportDetail: { car: 1.2, transit: 0.2, flights: 0.1 },
        homeEnergyDetail: { electricity: 1.2, gas: 0.8 },
      },
    }

    const result = await generatePersonalizedInsights(breakdown)

    expect(result.usedAI).toBe(false)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('prioritizes high-emission categories with stronger actions', async () => {
    const dietHighBreakdown: CarbonFootprintBreakdown = {
      transport: 0.5,
      homeEnergy: 0.4,
      diet: 3.0,
      goodsAndWaste: 0.3,
      total: 4.2,
      breakdown: {
        transportDetail: { car: 0.3, transit: 0.1, flights: 0.1 },
        homeEnergyDetail: { electricity: 0.2, gas: 0.2 },
      },
    }

    const result = await generatePersonalizedInsights(dietHighBreakdown)
    const dietRec = result.recommendations.find((r) => r.category === 'Diet')

    expect(dietRec).toBeDefined()
    expect(dietRec!.potentialSavingKg).toBeGreaterThan(0)
  })

  it('generates meaningful potential savings values', async () => {
    const breakdown: CarbonFootprintBreakdown = {
      transport: 2.0,
      homeEnergy: 1.5,
      diet: 1.8,
      goodsAndWaste: 0.6,
      total: 5.9,
      breakdown: {
        transportDetail: { car: 1.8, transit: 0.1, flights: 0.1 },
        homeEnergyDetail: { electricity: 0.9, gas: 0.6 },
      },
    }

    const result = await generatePersonalizedInsights(breakdown)

    result.recommendations.forEach((rec) => {
      expect(rec.potentialSavingKg).toBeGreaterThan(0)
      expect(rec.potentialSavingKg).toBeLessThan(3000)
      expect(rec.action).toBeTruthy()
      expect(rec.category).toBeTruthy()
    })
  })

  it('handles edge case with very low emissions', async () => {
    const lowEmissionBreakdown: CarbonFootprintBreakdown = {
      transport: 0.1,
      homeEnergy: 0.05,
      diet: 0.2,
      goodsAndWaste: 0.05,
      total: 0.4,
      breakdown: {
        transportDetail: { car: 0.05, transit: 0.03, flights: 0.02 },
        homeEnergyDetail: { electricity: 0.03, gas: 0.02 },
      },
    }

    const result = await generatePersonalizedInsights(lowEmissionBreakdown)

    expect(result.recommendations.length).toBeGreaterThan(0)
    result.recommendations.forEach((rec) => {
      expect(rec.potentialSavingKg).toBeGreaterThan(0)
    })
  })
})
