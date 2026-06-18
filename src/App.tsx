import { useEffect, useState } from 'react'
import './App.css'
import {
  calculateTotalFootprint,
  type CarbonFootprintBreakdown,
} from './lib/carbonEngine'
import { CalculatorForm } from './components/CarbonCalculatorForm'
import { ResultsPanel } from './components/CarbonResultsPanel'
import { OnboardingModal } from './components/OnboardingModal'
import { useHistory } from './hooks/useHistory'
import { shareResult } from './lib/shareUtils'
import {
  DEFAULT_FORM_DATA,
  DEFAULT_OPEN_SECTIONS,
  buildDietType,
  buildGoodsWasteInput,
  buildHomeEnergyInput,
  buildTransportInput,
  buildValidationErrors,
  isNumericField,
  parseNumericInput,
} from './components/calculatorConfig'
import {
  markOnboardingSeen,
  readOnboardingSeen,
} from './lib/onboarding'
import type {
  FormData,
  FormErrors,
  MessageState,
  SectionKey,
} from './components/calculatorTypes'

function App() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)
  const [results, setResults] = useState<CarbonFootprintBreakdown | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    ...DEFAULT_OPEN_SECTIONS,
  })
  const [saveMessage, setSaveMessage] = useState<MessageState | null>(null)
  const [actionMessage, setActionMessage] = useState<MessageState | null>(null)
  const [calculationRevision, setCalculationRevision] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboardingSeen())
  const { addEntry } = useHistory()

  useEffect(() => {
    if (!saveMessage) {
      return undefined
    }

    const timer = setTimeout(() => setSaveMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [saveMessage])

  useEffect(() => {
    if (!actionMessage) {
      return undefined
    }

    const timer = setTimeout(() => setActionMessage(null), 2000)
    return () => clearTimeout(timer)
  }, [actionMessage])

  const handleInputChange = (key: keyof FormData, value: string | number) => {
    if (typeof value === 'string' && isNumericField(key)) {
      const parsedValue = parseNumericInput(value)
      if (parsedValue === null) {
        setErrors((previous) => ({ ...previous, [key]: 'Please enter a valid number' }))
        return
      }

      setFormData((previous) => ({ ...previous, [key]: parsedValue } as FormData))
    } else {
      setFormData((previous) => ({ ...previous, [key]: value } as FormData))
    }

    setErrors((previous) => {
      if (!previous[key]) {
        return previous
      }

      const nextErrors = { ...previous }
      delete nextErrors[key]
      return nextErrors
    })
  }

  const handleCalculate = () => {
    const nextErrors = buildValidationErrors(formData)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const breakdown = calculateTotalFootprint(
      buildTransportInput(formData),
      buildHomeEnergyInput(formData),
      buildDietType(formData),
      buildGoodsWasteInput(formData),
    )

    setResults(breakdown)
    setCalculationRevision((previous) => previous + 1)
    setSaveMessage(null)
    setActionMessage(null)

    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        // Some browsers do not support smooth scrolling.
      }
    }
  }

  const toggleSection = (section: SectionKey) => {
    setOpenSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }))
  }

  const handleSaveToHistory = () => {
    if (!results) {
      return
    }

    const result = addEntry({
      total: results.total,
      breakdown: {
        transport: results.transport,
        homeEnergy: results.homeEnergy,
        diet: results.diet,
        goodsWaste: results.goodsAndWaste,
      },
    })

    if (result.success) {
      setSaveMessage({ text: 'Saved!', type: 'success' })
      return
    }

    setSaveMessage({ text: result.error || "Couldn't save, please try again", type: 'error' })
  }

  const handleDismissOnboarding = () => {
    setShowOnboarding(false)
    markOnboardingSeen()
  }

  const handleDownloadPdf = async () => {
    if (!results) {
      return
    }

    try {
      const { generatePersonalizedInsights } = await import('./lib/insightsEngine')
      const { generatePdfReport } = await import('./lib/pdfExport')
      const { recommendations } = await generatePersonalizedInsights(results)
      generatePdfReport(results, recommendations)
      setActionMessage({ text: 'PDF downloaded.', type: 'success' })
    } catch {
      setActionMessage({ text: 'Failed to generate PDF.', type: 'error' })
    }
  }

  const handleShare = async () => {
    if (!results) {
      return
    }

    const success = await shareResult(results.total)
    if (success) {
      const canShare = typeof navigator !== 'undefined' && 'share' in navigator
      setActionMessage({ text: canShare ? 'Shared!' : 'Copied to clipboard!', type: 'success' })
      return
    }

    setActionMessage({ text: 'Unable to share right now.', type: 'error' })
  }

  const handleCalculateAgain = () => {
    setResults(null)
    setSaveMessage(null)
    setActionMessage(null)
  }

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <OnboardingModal isOpen={showOnboarding} onDismiss={handleDismissOnboarding} />
      <header className="header">
        <h1>Carbon Footprint Awareness Platform</h1>
        <p className="subtitle">Understand, track, and reduce your carbon footprint.</p>
      </header>

      <main className="main-content" id="main-content">
        {results ? (
          <ResultsPanel
            results={results}
            calculationRevision={calculationRevision}
            saveMessage={saveMessage}
            actionMessage={actionMessage}
            onDownloadPdf={handleDownloadPdf}
            onShare={handleShare}
            onSaveToHistory={handleSaveToHistory}
            onCalculateAgain={handleCalculateAgain}
          />
        ) : (
          <CalculatorForm
            formData={formData}
            errors={errors}
            openSections={openSections}
            onToggleSection={toggleSection}
            onFieldChange={handleInputChange}
            onCalculate={handleCalculate}
          />
        )}
      </main>
    </div>
  )
}

export default App
