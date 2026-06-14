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
    const prompt = `Based on this carbon footprint breakdown (in tonnes CO2e/year):
- Transport: ${breakdown.transport.toFixed(2)}t
- Home Energy: ${breakdown.homeEnergy.toFixed(2)}t
- Diet: ${breakdown.diet.toFixed(2)}t
- Goods & Waste: ${breakdown.goodsAndWaste.toFixed(2)}t
- Total: ${breakdown.total.toFixed(2)}t

Generate 2-4 personalized, actionable recommendations targeting the largest categories.
Each recommendation should include:
- category: one of "Transport", "Home Energy", "Diet", or "Goods & Waste"
- action: specific, achievable action the user can take
- potentialSavingKg: realistic annual CO2e reduction in kg

Respond with ONLY a valid JSON array of objects with these exact fields.`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

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

    return parsed.filter((item) =>
      item.category &&
      item.action &&
      typeof item.potentialSavingKg === 'number'
    ).slice(0, 4)
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
