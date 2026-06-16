import { useState, useEffect, memo, useMemo } from 'react'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'
import type { Recommendation } from '../lib/insightsEngine'
import { useCompletedActions } from '../hooks/useCompletedActions'
import '../styles/PersonalizedInsights.css'

interface PersonalizedInsightsProps {
  breakdown: CarbonFootprintBreakdown
}

type InsightSource = '' | 'ai' | 'rule-based'

const CATEGORY_ICONS: Record<Recommendation['category'], string> = {
  Transport: '🚗',
  'Home Energy': '⚡',
  Diet: '🥗',
  'Goods & Waste': '🛍️',
}

function generateActionId(category: Recommendation['category'], action: string): string {
  return `${category}::${action}`
}

export const PersonalizedInsights = memo(function PersonalizedInsights({ breakdown }: PersonalizedInsightsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState<InsightSource>('')
  const [recs, setRecs] = useState<Recommendation[]>([])
  const { getCompletedActions, toggleAction: toggleStoredAction } = useCompletedActions()
  const [completedActionIds, setCompletedActionIds] = useState<Set<string>>(
    () => new Set(getCompletedActions())
  )

  useEffect(() => {
    let cancelled = false

    const generateInsights = async () => {
      const { generatePersonalizedInsights } = await import('../lib/insightsEngine')
      return await generatePersonalizedInsights(breakdown)
    }

    generateInsights().then((result) => {
      if (!cancelled) {
        setRecs(result.recommendations)
        setSource(result.usedAI ? 'ai' : 'rule-based')
        setIsLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [breakdown])

  const toggleAction = (category: Recommendation['category'], action: string) => {
    const actionId = generateActionId(category, action)
    toggleStoredAction(actionId)
    setCompletedActionIds((prev) => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  const totalSavingPotential = useMemo(() => {
    return Array.from(completedActionIds).reduce((total, actionId) => {
      const rec = recs.find((r) => generateActionId(r.category, r.action) === actionId)
      return total + (rec?.potentialSavingKg || 0)
    }, 0)
  }, [completedActionIds, recs])

  if (isLoading) {
    return (
      <div className="personalized-insights">
        <div className="insights-header">
          <h3>Personalized Insights</h3>
        </div>
        <div className="insights-loading" role="status"
             aria-label="Loading personalized insights">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Generating your personalized insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="personalized-insights">
      <div className="insights-header">
        <h3>Personalized Insights</h3>
        <span className={`insights-badge ${source === 'ai' ? 'ai-powered' : 'quick-tips'}`}>
          {source === 'ai' ? 'AI-Personalized' : 'Quick Tips'}
        </span>
      </div>

      <div className="recommendations-grid">
        {recs.map((rec) => {
          const actionId = generateActionId(rec.category, rec.action)
          const isCompleted = completedActionIds.has(actionId)
          return (
            <div
              key={actionId}
              className={`recommendation-card ${isCompleted ? 'completed' : ''}`}
            >
              <div className="card-header">
                <span className="category-icon" aria-label={`Category: ${rec.category}`} role="img">{CATEGORY_ICONS[rec.category]}</span>
                <span className="category-label">{rec.category}</span>
              </div>

              <p className="action-text">{rec.action}</p>

              <div className="saving-highlight">
                <strong>Potential saving:</strong> <span className="saving-value">{rec.potentialSavingKg.toLocaleString()}</span> kg CO₂e/year
              </div>

              <label className="action-checkbox">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => toggleAction(rec.category, rec.action)}
                  aria-label={`I'll try this: ${rec.action}`}
                />
                <span>{isCompleted ? '✓ Committed' : 'I\'ll try this'}</span>
              </label>
            </div>
          )
        })}
      </div>

      {completedActionIds.size > 0 && (
        <div className="commitment-summary">
          <div className="summary-content">
            <h4>Your Commitment</h4>
            <p>
              You've committed to <strong>{completedActionIds.size}</strong> action{completedActionIds.size !== 1 ? 's' : ''} —
              potential saving: <strong>{totalSavingPotential.toLocaleString()}</strong> kg CO₂e/year
            </p>
          </div>
        </div>
      )}
    </div>
  )
})
