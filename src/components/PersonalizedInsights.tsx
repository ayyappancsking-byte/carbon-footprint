import { memo, useEffect, useMemo, useState } from 'react'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'
import type { Recommendation } from '../lib/insightsEngine'
import { useCompletedActions } from '../hooks/useCompletedActions'
import '../styles/PersonalizedInsights.css'

interface PersonalizedInsightsProps {
  breakdown: CarbonFootprintBreakdown
}

interface RecommendationCardProps {
  recommendation: Recommendation
  isCompleted: boolean
  onToggle: () => void
}

type InsightSource = '' | 'ai' | 'rule-based'

const CATEGORY_ICONS: Record<Recommendation['category'], string> = {
  Transport: 'T',
  'Home Energy': 'H',
  Diet: 'D',
  'Goods & Waste': 'W',
}

function generateActionId(category: Recommendation['category'], action: string): string {
  return `${category}::${action}`
}

function RecommendationCard({ recommendation, isCompleted, onToggle }: RecommendationCardProps) {
  return (
    <div className={`recommendation-card ${isCompleted ? 'completed' : ''}`}>
      <div className="card-header">
        <span className="category-icon" aria-hidden="true" role="img">
          {CATEGORY_ICONS[recommendation.category]}
        </span>
        <span className="category-label">{recommendation.category}</span>
      </div>

      <p className="action-text">{recommendation.action}</p>

      <div className="saving-highlight">
        <strong>Potential saving:</strong>{' '}
        <span className="saving-value">{recommendation.potentialSavingKg.toLocaleString()}</span> kg CO2e/year
      </div>

      <label className="action-checkbox">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={onToggle}
          aria-label={`I'll try this: ${recommendation.action}`}
        />
        <span>{isCompleted ? 'Committed' : "I'll try this"}</span>
      </label>
    </div>
  )
}

export const PersonalizedInsights = memo(function PersonalizedInsights({
  breakdown,
}: PersonalizedInsightsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState<InsightSource>('')
  const [recs, setRecs] = useState<Recommendation[]>([])
  const { getCompletedActions, toggleAction: toggleStoredAction } = useCompletedActions()
  const [completedActionIds, setCompletedActionIds] = useState<Set<string>>(
    () => new Set(getCompletedActions()),
  )

  useEffect(() => {
    let cancelled = false

    const generateInsights = async () => {
      const { generatePersonalizedInsights } = await import('../lib/insightsEngine')
      return generatePersonalizedInsights(breakdown)
    }

    generateInsights()
      .then((result) => {
        if (cancelled) {
          return
        }

        setRecs(result.recommendations)
        setSource(result.usedAI ? 'ai' : 'rule-based')
        setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setSource('rule-based')
          setRecs([])
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [breakdown, getCompletedActions])

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
      const recommendation = recs.find((item) => generateActionId(item.category, item.action) === actionId)
      return total + (recommendation?.potentialSavingKg ?? 0)
    }, 0)
  }, [completedActionIds, recs])

  if (isLoading) {
    return (
      <div className="personalized-insights">
        <div className="insights-header">
          <h3>Personalized Insights</h3>
        </div>
        <div className="insights-loading" role="status" aria-live="polite" aria-label="Loading personalized insights">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Generating your personalized insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="personalized-insights" aria-live="polite" aria-atomic="true">
      <div className="insights-header">
        <h3>Personalized Insights</h3>
        <span className={`insights-badge ${source === 'ai' ? 'ai-powered' : 'quick-tips'}`}>
          {source === 'ai' ? 'AI-Personalized' : 'Quick Tips'}
        </span>
      </div>

      <div className="recommendations-grid" aria-label="Personalized recommendations">
        {recs.map((recommendation) => {
          const actionId = generateActionId(recommendation.category, recommendation.action)
          const isCompleted = completedActionIds.has(actionId)

          return (
            <RecommendationCard
              key={actionId}
              recommendation={recommendation}
              isCompleted={isCompleted}
              onToggle={() => toggleAction(recommendation.category, recommendation.action)}
            />
          )
        })}
      </div>

      {completedActionIds.size > 0 && (
        <div className="commitment-summary" role="status" aria-live="polite">
          <div className="summary-content">
            <h4>Your Commitment</h4>
            <p>
              You&apos;ve committed to <strong>{completedActionIds.size}</strong> action
              {completedActionIds.size !== 1 ? 's' : ''} - potential saving:{' '}
              <strong>{totalSavingPotential.toLocaleString()}</strong> kg CO2e/year
            </p>
          </div>
        </div>
      )}
    </div>
  )
})
