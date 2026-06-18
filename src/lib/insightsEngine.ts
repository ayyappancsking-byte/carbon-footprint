import { GoogleGenAI } from '@google/genai'
import type { CarbonFootprintBreakdown } from './carbonEngine'

export interface Recommendation {
  category: 'Transport' | 'Home Energy' | 'Diet' | 'Goods & Waste'
  action: string
  potentialSavingKg: number
}

export interface CategoryBreakdown {
  transport: number
  homeEnergy: number
  diet: number
  goodsAndWaste: number
  total: number
}

interface RankedCategory {
  name: Recommendation['category']
  value: number
}

interface ApiRecommendationPayload {
  category: string
  action: string
  potentialSavingKg: number
}

interface FallbackRecommendationConfig {
  threshold: number
  high: Omit<Recommendation, 'category'>
  low: Omit<Recommendation, 'category'>
}

let lastAPICallTime = 0
const API_CALL_COOLDOWN_MS = 4000
const MAX_RECOMMENDATIONS = 4
const FALLBACK_RECOMMENDATIONS: Record<Recommendation['category'], FallbackRecommendationConfig> = {
  Transport: {
    threshold: 2,
    high: {
      action: 'Switch one car trip per day to public transit or cycling',
      potentialSavingKg: 1500,
    },
    low: {
      action: 'Carpool 2-3 times per week to reduce emissions',
      potentialSavingKg: 800,
    },
  },
  'Home Energy': {
    threshold: 1.5,
    high: {
      action: 'Switch to a renewable energy provider or install solar panels',
      potentialSavingKg: 2000,
    },
    low: {
      action: 'Upgrade to LED lighting and improve insulation',
      potentialSavingKg: 600,
    },
  },
  Diet: {
    threshold: 2.5,
    high: {
      action: 'Replace red meat with chicken or plant-based alternatives for 3 meals each week',
      potentialSavingKg: 800,
    },
    low: {
      action: 'Try Meatless Mondays once per week',
      potentialSavingKg: 250,
    },
  },
  'Goods & Waste': {
    threshold: 0.8,
    high: {
      action: 'Buy secondhand items instead of new, aiming for half of your purchases',
      potentialSavingKg: 900,
    },
    low: {
      action: 'Start composting and reduce landfill waste by 25%',
      potentialSavingKg: 200,
    },
  },
}

/**
 * Rank the carbon footprint categories from highest to lowest.
 */
function rankCategories(breakdown: CategoryBreakdown): RankedCategory[] {
  const categories: RankedCategory[] = [
    { name: 'Transport', value: breakdown.transport },
    { name: 'Home Energy', value: breakdown.homeEnergy },
    { name: 'Diet', value: breakdown.diet },
    { name: 'Goods & Waste', value: breakdown.goodsAndWaste },
  ]

  return categories.sort((a, b) => b.value - a.value)
}

/**
 * Build a fallback recommendation for a single category.
 */
function buildFallbackRecommendation(category: RankedCategory): Recommendation | null {
  if (category.value <= 0) {
    return null
  }

  const config = FALLBACK_RECOMMENDATIONS[category.name]
  const recommendation = category.value > config.threshold ? config.high : config.low

  return {
    category: category.name,
    action: recommendation.action,
    potentialSavingKg: recommendation.potentialSavingKg,
  }
}

/**
 * Generate rule-based recommendations when the AI service is unavailable.
 */
function generateFallbackRecommendations(breakdown: CategoryBreakdown): Recommendation[] {
  const ranked = rankCategories(breakdown).slice(0, MAX_RECOMMENDATIONS)
  const recommendations: Recommendation[] = []

  for (const category of ranked) {
    const recommendation = buildFallbackRecommendation(category)
    if (recommendation) {
      recommendations.push(recommendation)
    }
  }

  return recommendations
}

/**
 * Build the prompt used for Gemini recommendation generation.
 */
function buildGeminiPrompt(breakdown: CategoryBreakdown): string {
  return `Given this carbon footprint breakdown in kg CO2e per year:
Transport: ${(breakdown.transport * 1000).toFixed(0)}
Home Energy: ${(breakdown.homeEnergy * 1000).toFixed(0)}
Diet: ${(breakdown.diet * 1000).toFixed(0)}
Goods & Waste: ${(breakdown.goodsAndWaste * 1000).toFixed(0)}

Give 2-4 personalized recommendations targeting the biggest categories first.
Return ONLY a JSON array:
[{"category":"diet","action":"...","potentialSavingKg":500}]`
}

/**
 * Extract the first JSON array found in a Gemini response.
 */
function extractJsonArray(content: string): string | null {
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  return jsonMatch?.[0] ?? null
}

/**
 * Convert a free-form category string into the supported recommendation categories.
 */
function normalizeRecommendationCategory(value: string): Recommendation['category'] | null {
  const normalized = value.trim().toLowerCase()

  switch (normalized) {
    case 'transport':
      return 'Transport'
    case 'home energy':
    case 'home_energy':
    case 'home-energy':
      return 'Home Energy'
    case 'diet':
      return 'Diet'
    case 'goods & waste':
    case 'goods and waste':
    case 'goods_waste':
    case 'goods-waste':
      return 'Goods & Waste'
    default:
      return null
  }
}

/**
 * Check whether a parsed JSON item looks like a recommendation payload.
 */
function isRecommendationPayload(value: unknown): value is ApiRecommendationPayload {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<ApiRecommendationPayload>

  return (
    typeof candidate.category === 'string' &&
    typeof candidate.action === 'string' &&
    typeof candidate.potentialSavingKg === 'number' &&
    Number.isFinite(candidate.potentialSavingKg)
  )
}

/**
 * Convert an AI payload into a safe Recommendation object.
 */
function normalizeRecommendationPayload(
  payload: ApiRecommendationPayload,
): Recommendation | null {
  const category = normalizeRecommendationCategory(payload.category)
  const action = payload.action.trim()

  if (!category || action.length === 0) {
    return null
  }

  return {
    category,
    action,
    potentialSavingKg: payload.potentialSavingKg > 0 ? payload.potentialSavingKg : 0,
  }
}

/**
 * Parse and validate Gemini output into the Recommendation model.
 */
function parseApiRecommendations(content: string): Recommendation[] | null {
  const jsonArray = extractJsonArray(content)
  if (!jsonArray) {
    return null
  }

  try {
    const parsed = JSON.parse(jsonArray) as unknown[]
    const recommendations = parsed
      .filter(isRecommendationPayload)
      .map(normalizeRecommendationPayload)
      .filter((item): item is Recommendation => item !== null)

    return recommendations.slice(0, MAX_RECOMMENDATIONS)
  } catch {
    return null
  }
}

/**
 * Call Gemini for personalized recommendations, falling back to null on any recoverable failure.
 */
async function callGeminiAPI(
  breakdown: CategoryBreakdown,
  apiKey: string,
): Promise<Recommendation[] | null> {
  const now = Date.now()
  if (lastAPICallTime > 0 && now - lastAPICallTime < API_CALL_COOLDOWN_MS) {
    return null
  }

  lastAPICallTime = now

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildGeminiPrompt(breakdown),
    })

    const recommendations = parseApiRecommendations(response.text ?? '')
    return recommendations && recommendations.length > 0 ? recommendations : null
  } catch {
    return null
  }
}

/**
 * Convert a footprint breakdown into the recommendation engine input format.
 */
function toCategoryBreakdown(breakdown: CarbonFootprintBreakdown): CategoryBreakdown {
  return {
    transport: breakdown.transport,
    homeEnergy: breakdown.homeEnergy,
    diet: breakdown.diet,
    goodsAndWaste: breakdown.goodsAndWaste,
    total: breakdown.total,
  }
}

/**
 * Generate personalized insights using Gemini when available, otherwise use the fallback engine.
 */
export async function generatePersonalizedInsights(
  breakdown: CarbonFootprintBreakdown,
  apiKeyOverride?: string,
): Promise<{ recommendations: Recommendation[]; usedAI: boolean }> {
  const categoryBreakdown = toCategoryBreakdown(breakdown)

  const apiKey = apiKeyOverride ?? import.meta.env.VITE_GEMINI_API_KEY
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    const aiRecommendations = await callGeminiAPI(categoryBreakdown, apiKey)
    if (aiRecommendations && aiRecommendations.length > 0) {
      return { recommendations: aiRecommendations, usedAI: true }
    }
  }

  return {
    recommendations: generateFallbackRecommendations(categoryBreakdown),
    usedAI: false,
  }
}
