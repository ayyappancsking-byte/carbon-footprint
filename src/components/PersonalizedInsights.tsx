import { useState, useEffect } from 'react'
import { generatePersonalizedInsights, type Recommendation } from '../lib/insightsEngine'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'
import '../styles/PersonalizedInsights.css'

interface PersonalizedInsightsProps {
  breakdown: CarbonFootprintBreakdown
}

const CATEGORY_ICONS: Record<Recommendation['category'], string> = {
  Transport: '🚗',
  'Home Energy': '⚡',
  Diet: '🥗',
  'Goods & Waste': '🛍️',
}

export function PersonalizedInsights({ breakdown }: PersonalizedInsightsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [usedAI, setUsedAI] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchInsights = async () => {
      const result = await generatePersonalizedInsights(breakdown)
      setRecommendations(result.recommendations)
      setUsedAI(result.usedAI)
      setLoading(false)
    }

    fetchInsights()
  }, [breakdown])

  const toggleAction = (index: number) => {
    const newCompleted = new Set(completedActions)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedActions(newCompleted)
  }

  if (loading) {
    return (
      <div className="personalized-insights">
        <div className="insights-header">
          <h3>Personalized Insights</h3>
          <span className="insights-badge">Loading...</span>
        </div>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="personalized-insights">
      <div className="insights-header">
        <h3>Personalized Insights</h3>
        <span className={`insights-badge ${usedAI ? 'ai-powered' : 'quick-tips'}`}>
          {usedAI ? 'AI-Personalized' : 'Quick Tips'}
        </span>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`recommendation-card ${completedActions.has(index) ? 'completed' : ''}`}
          >
            <div className="card-header">
              <span className="category-icon">{CATEGORY_ICONS[rec.category]}</span>
              <span className="category-label">{rec.category}</span>
            </div>

            <p className="action-text">{rec.action}</p>

            <div className="saving-highlight">
              <strong>Potential saving:</strong> <span className="saving-value">{rec.potentialSavingKg.toLocaleString()}</span> kg CO₂e/year
            </div>

            <label className="action-checkbox">
              <input
                type="checkbox"
                checked={completedActions.has(index)}
                onChange={() => toggleAction(index)}
                aria-label={`I'll try this: ${rec.action}`}
              />
              <span>I'll try this</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
