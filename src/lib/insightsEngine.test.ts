import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generatePersonalizedInsights } from './insightsEngine'
import type { CarbonFootprintBreakdown } from './carbonEngine'

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}))

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = {
      generateContent: generateContentMock,
    }

    constructor(options: { apiKey: string }) {
      void options
    }
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
  }
})

function createBreakdown(
  overrides: Partial<CarbonFootprintBreakdown> = {},
): CarbonFootprintBreakdown {
  return {
    transport: 1,
    homeEnergy: 1,
    diet: 1,
    goodsAndWaste: 1,
    total: 4,
    breakdown: {
      transportDetail: {
        car: 0.6,
        transit: 0.3,
        flights: 0.1,
      },
      homeEnergyDetail: {
        electricity: 0.7,
        gas: 0.3,
      },
    },
    ...overrides,
  }
}

describe('insightsEngine', () => {
  beforeEach(() => {
    generateContentMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to rule-based recommendations when no API key is configured', async () => {
    const result = await generatePersonalizedInsights(
      createBreakdown({
        transport: 3.2,
        homeEnergy: 2.8,
        diet: 2.9,
        goodsAndWaste: 1.1,
        total: 10,
      }),
      '',
    )

    expect(result.usedAI).toBe(false)
    expect(generateContentMock).not.toHaveBeenCalled()
    expect(result.recommendations).toEqual([
      {
        category: 'Transport',
        action: 'Switch one car trip per day to public transit or cycling',
        potentialSavingKg: 1500,
      },
      {
        category: 'Diet',
        action: 'Replace red meat with chicken or plant-based alternatives for 3 meals each week',
        potentialSavingKg: 800,
      },
      {
        category: 'Home Energy',
        action: 'Switch to a renewable energy provider or install solar panels',
        potentialSavingKg: 2000,
      },
      {
        category: 'Goods & Waste',
        action: 'Buy secondhand items instead of new, aiming for half of your purchases',
        potentialSavingKg: 900,
      },
    ])
  })

  it('uses lower-intensity fallback actions and skips zero-value categories', async () => {
    const result = await generatePersonalizedInsights(
      createBreakdown({
        transport: 1.2,
        homeEnergy: 0,
        diet: 1.5,
        goodsAndWaste: 0.5,
        total: 3.2,
      }),
      '',
    )

    expect(result.usedAI).toBe(false)
    expect(result.recommendations).toEqual([
      {
        category: 'Diet',
        action: 'Try Meatless Mondays once per week',
        potentialSavingKg: 250,
      },
      {
        category: 'Transport',
        action: 'Carpool 2-3 times per week to reduce emissions',
        potentialSavingKg: 800,
      },
      {
        category: 'Goods & Waste',
        action: 'Start composting and reduce landfill waste by 25%',
        potentialSavingKg: 200,
      },
    ])
  })

  it('uses Gemini recommendations when the response contains valid JSON', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000)

    const payload = [
      null,
      42,
      { category: 'diet', action: '   ', potentialSavingKg: 2 },
      { category: 'home-energy', action: ' Reduce heating ', potentialSavingKg: 12.5 },
      { category: 'goods_waste', action: 'Use secondhand', potentialSavingKg: -4 },
      { category: 'transport', action: 'Carpool', potentialSavingKg: 8 },
      { category: 'diet', action: 'Add plant meals', potentialSavingKg: 3 },
      { category: 'transport', action: 'Take the bus', potentialSavingKg: 1 },
      { category: 'unknown', action: 'Skip this', potentialSavingKg: 9 },
    ]

    generateContentMock.mockResolvedValueOnce({
      text: `Introductory text ${JSON.stringify(payload)} trailing notes`,
    })

    const result = await generatePersonalizedInsights(
      createBreakdown({
        transport: 3.5,
        homeEnergy: 1.25,
        diet: 2.2,
        goodsAndWaste: 0.4,
        total: 7.35,
      }),
      'test-api-key',
    )

    expect(result.usedAI).toBe(true)
    expect(generateContentMock).toHaveBeenCalledTimes(1)
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Transport: 3500'),
      }),
    )
    expect(result.recommendations).toEqual([
      {
        category: 'Home Energy',
        action: 'Reduce heating',
        potentialSavingKg: 12.5,
      },
      {
        category: 'Goods & Waste',
        action: 'Use secondhand',
        potentialSavingKg: 0,
      },
      {
        category: 'Transport',
        action: 'Carpool',
        potentialSavingKg: 8,
      },
      {
        category: 'Diet',
        action: 'Add plant meals',
        potentialSavingKg: 3,
      },
    ])
  })

  it('falls back when Gemini returns text without a JSON array', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(20_000)

    generateContentMock.mockResolvedValueOnce({
      text: 'No JSON appears in this response',
    })

    const result = await generatePersonalizedInsights(createBreakdown(), 'test-api-key')

    expect(result.usedAI).toBe(false)
    expect(generateContentMock).toHaveBeenCalledTimes(1)
  })

  it('falls back when Gemini returns malformed JSON', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(30_000)

    generateContentMock.mockResolvedValueOnce({
      text: 'Here is a broken payload: [not valid json]',
    })

    const result = await generatePersonalizedInsights(createBreakdown(), 'test-api-key')

    expect(result.usedAI).toBe(false)
    expect(generateContentMock).toHaveBeenCalledTimes(1)
  })

  it('falls back when Gemini returns an empty array', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(40_000)

    generateContentMock.mockResolvedValueOnce({
      text: '[]',
    })

    const result = await generatePersonalizedInsights(createBreakdown(), 'test-api-key')

    expect(result.usedAI).toBe(false)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('falls back when Gemini rejects', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(50_000)

    generateContentMock.mockRejectedValueOnce(new Error('API down'))

    const result = await generatePersonalizedInsights(createBreakdown(), 'test-api-key')

    expect(result.usedAI).toBe(false)
    expect(generateContentMock).toHaveBeenCalledTimes(1)
  })

  it('respects the Gemini cooldown window between calls', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(60_000)

    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify([
        { category: 'transport', action: 'Carpool', potentialSavingKg: 8 },
      ]),
    })

    const firstResult = await generatePersonalizedInsights(
      createBreakdown({
        transport: 3.5,
        homeEnergy: 1.25,
        diet: 2.2,
        goodsAndWaste: 0.4,
        total: 7.35,
      }),
      'test-api-key',
    )
    const secondResult = await generatePersonalizedInsights(
      createBreakdown({
        transport: 3.5,
        homeEnergy: 1.25,
        diet: 2.2,
        goodsAndWaste: 0.4,
        total: 7.35,
      }),
      'test-api-key',
    )

    expect(firstResult.usedAI).toBe(true)
    expect(secondResult.usedAI).toBe(false)
    expect(generateContentMock).toHaveBeenCalledTimes(1)
  })
})
