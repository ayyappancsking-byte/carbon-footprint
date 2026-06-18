import type { ReactNode } from 'react'
import { HistorySection } from './HistorySection'
import { GoalSetting } from './GoalSetting'
import { PersonalizedInsights } from './PersonalizedInsights'
import { ResultsBreakdown } from './ResultsBreakdown'
import type { MessageState, ResultsPanelProps } from './calculatorTypes'

interface MessageBannerProps {
  message: MessageState | null
  className: string
}

interface ActionButtonGroupProps {
  ariaLabel: string
  children: ReactNode
}

/**
 * Announce transient status updates.
 */
function MessageBanner({ message, className }: MessageBannerProps) {
  if (!message) {
    return null
  }

  return (
    <div
      className={`${className} ${className}-${message.type}`}
      role={message.type === 'error' ? 'alert' : 'status'}
      aria-live={message.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {message.text}
    </div>
  )
}

/**
 * Group related action buttons under a single accessible label.
 */
function ActionButtonGroup({ ariaLabel, children }: ActionButtonGroupProps) {
  return (
    <div className="button-group" role="group" aria-label={ariaLabel}>
      {children}
    </div>
  )
}

/**
 * Render the results view, actions, and supporting sections.
 */
export function ResultsPanel({
  results,
  calculationRevision,
  saveMessage,
  actionMessage,
  onDownloadPdf,
  onShare,
  onSaveToHistory,
  onCalculateAgain,
}: ResultsPanelProps) {
  return (
    <section className="results-section" aria-label="Carbon footprint results">
      <ResultsBreakdown data={results} />
      <PersonalizedInsights key={calculationRevision} breakdown={results} />

      <ActionButtonGroup ariaLabel="Report actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onDownloadPdf}
          aria-label="Download carbon footprint report as a PDF"
        >
          Download as PDF
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onShare}
          aria-label="Share carbon footprint result"
        >
          Share
        </button>
      </ActionButtonGroup>

      <MessageBanner message={actionMessage} className="save-message" />

      <ActionButtonGroup ariaLabel="History actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onSaveToHistory}
          aria-label="Save this entry to history"
        >
          Save this entry to my history
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCalculateAgain}
          aria-label="Calculate your footprint again"
        >
          Calculate Again
        </button>
      </ActionButtonGroup>

      <MessageBanner message={saveMessage} className="save-message" />

      <GoalSetting />
      <HistorySection />
    </section>
  )
}
