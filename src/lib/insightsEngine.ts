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

function rankCategories(breakdown: CategoryBreakdown): Array<{
  name: 'Transport' | 'Home Energy' | 'Diet' | 'Goods & Waste'
  value: number
}> {
  const categories: Array<{
    name: 'Transport' | 'Home Energy' | 'Diet' | 'Goods & Waste'
    value: number
  }> = [
    { name: 'Transport', value: breakdown.transport },
    { name: 'Home Energy', value: breakdown.homeEnergy },
    { name: 'Diet', value: breakdown.diet },
    { name: 'Goods & Waste', value: breakdown.goodsAndWaste },
  ]
  return categories.sort((a, b) => b.value - a.value)
}

function generateFallbackRecommendations(breakdown: CategoryBreakdown): Recommendation[] {
  const ranked = rankCategories(breakdown)
  const recommendations: Recommendation[] = []

  for (let i = 0; i < Math.min(3, ranked.length); i++) {
    const category = ranked[i]

    if (category.name === 'Transport' && category.value > 0) {
      if (category.value > 2) {
        recommendations.push({
          category: 'Transport',
          action: 'Switch one car trip per day to public transit or cycling',
          potentialSavingKg: 1500,
        })
      } else {
        recommendations.push({
          category: 'Transport',
          action: 'Carpool 2-3 times per week to reduce emissions',
          potentialSavingKg: 800,
        })
      }
    }

    if (category.name === 'Home Energy' && category.value > 0) {
      if (category.value > 1.5) {
        recommendations.push({
          category: 'Home Energy',
          action: 'Switch to renewable energy provider or install solar panels',
          potentialSavingKg: 2000,
        })
      } else {
        recommendations.push({
          category: 'Home Energy',
          action: 'Upgrade to LED lighting and improve insulation',
          potentialSavingKg: 600,
        })
      }
    }

    if (category.name === 'Diet' && category.value > 0) {
      if (category.value > 2.5) {
        recommendations.push({
          category: 'Diet',
          action: 'Replace red meat with chicken or plant-based alternatives 3 meals/week',
          potentialSavingKg: 800,
        })
      } else {
        recommendations.push({
          category: 'Diet',
          action: 'Try "Meatless Mondays" once per week',
          potentialSavingKg: 250,
        })
      }
    }

    if (category.name === 'Goods & Waste' && category.value > 0) {
      if (category.value > 0.8) {
        recommendations.push({
          category: 'Goods & Waste',
          action: 'Buy secondhand items instead of new, aim for 50% of purchases',
          potentialSavingKg: 900,
        })
      } else {
        recommendations.push({
          category: 'Goods & Waste',
          action: 'Start composting and reduce landfill waste by 25%',
          potentialSavingKg: 200,
        })
      }
    }
  }

  return recommendations.slice(0, 4)
}

async function callGeminiAPI(
  breakdown: CategoryBreakdown,
  apiKey: string,
): Promise<Recommendation[] | null> {
  try {
    const ai = new GoogleGenAI({ apiKey })

    const prompt = `Given this carbon footprint breakdown in kg CO2e per year:
    Transport: ${(breakdown.transport * 1000).toFixed(0)}
    Home Energy: ${(breakdown.homeEnergy * 1000).toFixed(0)}
    Diet: ${(breakdown.diet * 1000).toFixed(0)}
    Goods & Waste: ${(breakdown.goodsAndWaste * 1000).toFixed(0)}

    Give 2-4 personalized recommendations targeting the biggest
    categories first. Return ONLY a JSON array:
    [{"category": "diet", "action": "...", "potentialSavingKg": 500}]`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    const content = response.text

    if (!content) {
      return null
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!Array.isArray(parsed)) {
      return null
    }

    return parsed
      .filter((item) =>
        item.category &&
        item.action &&
        typeof item.potentialSavingKg === 'number'
      )
      .map((item) => ({
        ...item,
        category: item.category.charAt(0).toUpperCase() + item.category.slice(1) as Recommendation['category'],
      }))
      .slice(0, 4)
  } catch {
    return null
  }
}

export async function generatePersonalizedInsights(
  breakdown: CarbonFootprintBreakdown,
): Promise<{ recommendations: Recommendation[]; usedAI: boolean }> {
  const categoryBreakdown: CategoryBreakdown = {
    transport: breakdown.transport,
    homeEnergy: breakdown.homeEnergy,
    diet: breakdown.diet,
    goodsAndWaste: breakdown.goodsAndWaste,
    total: breakdown.total,
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    const aiRecommendations = await callGeminiAPI(categoryBreakdown, apiKey)
    if (aiRecommendations && aiRecommendations.length > 0) {
      return { recommendations: aiRecommendations, usedAI: true }
    }
  }

  const fallbackRecommendations = generateFallbackRecommendations(categoryBreakdown)
  return { recommendations: fallbackRecommendations, usedAI: false }
}
