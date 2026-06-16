import { useState, useEffect } from 'react'
import './App.css'
import {
  calculateTotalFootprint,
  type DietType,
  type TransportInput,
  type HomeEnergyInput,
  type GoodsWasteInput,
  type CarbonFootprintBreakdown,
} from './lib/carbonEngine'
import { PersonalizedInsights } from './components/PersonalizedInsights'
import { HistorySection } from './components/HistorySection'
import { OnboardingModal } from './components/OnboardingModal'
import { GoalSetting } from './components/GoalSetting'
import { ResultsBreakdown } from './components/ResultsBreakdown'
import { useHistory } from './hooks/useHistory'
import { shareResult } from './lib/shareUtils'

type DietOption = 'vegan' | 'vegetarian' | 'pescatarian' | 'meatMedium' | 'meatHigh'

interface FormData {
  // Transport
  carKmPerWeek: number
  carFuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric'
  transitKmPerWeek: number
  shortFlightsPerYear: number
  longFlightsPerYear: number
  // Home Energy
  electricityKwhPerMonth: number
  gasKwhPerMonth: number
  householdSize: number
  // Diet & Consumption
  diet: DietOption
  goodsSpendingPerMonth: number
  landfillKgPerWeek: number
}

const DEFAULT_FORM_DATA: FormData = {
  carKmPerWeek: 0,
  carFuelType: 'petrol',
  transitKmPerWeek: 0,
  shortFlightsPerYear: 0,
  longFlightsPerYear: 0,
  electricityKwhPerMonth: 0,
  gasKwhPerMonth: 0,
  householdSize: 1,
  diet: 'meatMedium',
  goodsSpendingPerMonth: 0,
  landfillKgPerWeek: 0,
}

const NUMERIC_FIELDS = new Set<keyof FormData>([
  'carKmPerWeek',
  'transitKmPerWeek',
  'shortFlightsPerYear',
  'longFlightsPerYear',
  'electricityKwhPerMonth',
  'gasKwhPerMonth',
  'householdSize',
  'goodsSpendingPerMonth',
  'landfillKgPerWeek',
])

const TOOLTIP_TEXTS: Record<string, string> = {
  carDistance:
    'Average distance you drive per week. Include commute, shopping, leisure.',
  carFuel:
    'Electric vehicles have the lowest emissions. Hybrids are a good middle ground.',
  transitDistance: 'Public transport per week (buses, trains, trams). Much lower emissions than cars.',
  shortFlights:
    'Flights under 900km. Include return trips. Each flight is a significant emission event.',
  longFlights:
    'Flights over 900km. Typically international. Long distances amplify impact.',
  electricity:
    'Check your utility bills. UK average household uses ~250-350 kWh/month.',
  gas: 'Natural gas for heating and cooking. In kWh equivalents. UK average ~40-60 kWh/month.',
  household:
    'Number of people sharing energy use. Emissions are often divided per capita.',
  diet: 'Dietary choices have significant climate impact. Meat production is most carbon-intensive.',
  goods:
    'Monthly spending on new clothes, electronics, furniture, etc. Does not include groceries.',
  waste: 'Waste going to landfill per week in kg. Include general household waste.',
}

function readOnboardingSeen(): boolean {
  try {
    return localStorage.getItem('hasSeenOnboarding') === 'true'
  } catch {
    return false
  }
}

function markOnboardingSeen(): void {
  try {
    localStorage.setItem('hasSeenOnboarding', 'true')
  } catch {
    // Ignore storage failures so the app still works in restricted browsers.
  }
}

function createSectionId(title: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-content`
}

function Tooltip({
  label,
  text,
  id,
}: {
  label: string
  text: string
  id: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span className="tooltip-wrapper">
      <button
        type="button"
        className="tooltip-btn"
        aria-label={`More information about ${label}`}
        aria-expanded={showTooltip}
        aria-controls={id}
        aria-describedby={showTooltip ? id : undefined}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        (i)
      </button>
      {showTooltip && (
        <div className="tooltip" id={id} role="tooltip">
          {text}
        </div>
      )}
    </span>
  )
}

function FormField({
  label,
  tooltipId,
  tooltipText,
  children,
}: {
  label: string
  tooltipId: string
  tooltipText: string
  children: React.ReactNode
}) {
  return (
    <div className="form-field">
      <label>
        {label}
        <Tooltip label={label} text={tooltipText} id={tooltipId} />
      </label>
      {children}
    </div>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}

function FormSection({ title, children, isOpen, onToggle }: SectionProps) {
  const contentId = createSectionId(title)

  return (
    <fieldset className={`form-section ${isOpen ? 'open' : ''}`}>
      <legend className="sr-only">{title}</legend>
      <button
        type="button"
        className="section-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
        <span>{title}</span>
      </button>
      {isOpen && (
        <div className="section-content" id={contentId}>
          {children}
        </div>
      )}
    </fieldset>
  )
}

function App() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)
  const [results, setResults] = useState<CarbonFootprintBreakdown | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [openSections, setOpenSections] = useState({
    transport: true,
    energy: true,
    diet: true,
  })
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [historyKey, setHistoryKey] = useState(0)
  const [calculationKey, setCalculationKey] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboardingSeen())
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const { addEntry } = useHistory()

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveMessage])

  useEffect(() => {
    if (shareMessage) {
      const timer = setTimeout(() => setShareMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [shareMessage])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (isNaN(formData.carKmPerWeek) || formData.carKmPerWeek < 0 || formData.carKmPerWeek > 5000) {
      newErrors.carKmPerWeek = 'Car distance must be between 0-5000 km/week'
    }
    if (isNaN(formData.transitKmPerWeek) || formData.transitKmPerWeek < 0 || formData.transitKmPerWeek > 5000) {
      newErrors.transitKmPerWeek = 'Transit distance must be between 0-5000 km/week'
    }
    if (isNaN(formData.shortFlightsPerYear) || formData.shortFlightsPerYear < 0 || formData.shortFlightsPerYear > 100) {
      newErrors.shortFlightsPerYear = 'Short-haul flights must be between 0-100/year'
    }
    if (isNaN(formData.longFlightsPerYear) || formData.longFlightsPerYear < 0 || formData.longFlightsPerYear > 100) {
      newErrors.longFlightsPerYear = 'Long-haul flights must be between 0-100/year'
    }
    if (isNaN(formData.electricityKwhPerMonth) || formData.electricityKwhPerMonth < 0 || formData.electricityKwhPerMonth > 2000) {
      newErrors.electricityKwhPerMonth = 'Electricity must be between 0-2000 kWh/month'
    }
    if (isNaN(formData.gasKwhPerMonth) || formData.gasKwhPerMonth < 0 || formData.gasKwhPerMonth > 2000) {
      newErrors.gasKwhPerMonth = 'Gas must be between 0-2000 kWh/month'
    }
    if (isNaN(formData.householdSize) || formData.householdSize < 1 || formData.householdSize > 20) {
      newErrors.householdSize = 'Household size must be between 1-20'
    }
    if (isNaN(formData.goodsSpendingPerMonth) || formData.goodsSpendingPerMonth < 0 || formData.goodsSpendingPerMonth > 10000) {
      newErrors.goodsSpendingPerMonth = 'Goods spending must be between 0-10000/month'
    }
    if (isNaN(formData.landfillKgPerWeek) || formData.landfillKgPerWeek < 0 || formData.landfillKgPerWeek > 200) {
      newErrors.landfillKgPerWeek = 'Landfill waste must be between 0-200 kg/week'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (key: keyof FormData, value: string | number) => {
    if (typeof value === 'string' && NUMERIC_FIELDS.has(key)) {
      if (value === '') {
        setFormData((prev) => ({ ...prev, [key]: 0 } as FormData))
      } else {
        const parsed = Number(value)
        if (Number.isNaN(parsed)) {
          setErrors((prev) => ({ ...prev, [key]: 'Please enter a valid number' }))
          return
        }
        setFormData((prev) => ({ ...prev, [key]: parsed } as FormData))
      }
    } else {
      setFormData((prev) => ({ ...prev, [key]: value } as FormData))
    }

    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  const handleCalculate = () => {
    if (!validateForm()) return

    const transportInput: TransportInput = {
      carKmPerWeek: formData.carKmPerWeek,
      fuelType: formData.carFuelType,
      transitKmPerWeek: formData.transitKmPerWeek,
      shortFlightsPerYear: formData.shortFlightsPerYear,
      longFlightsPerYear: formData.longFlightsPerYear,
    }

    const energyInput: HomeEnergyInput = {
      electricityKwhPerMonth: formData.electricityKwhPerMonth,
      gasKwhPerMonth: formData.gasKwhPerMonth,
      householdSize: formData.householdSize,
    }

    const goodsWasteInput: GoodsWasteInput = {
      goodsSpendingPerMonth: formData.goodsSpendingPerMonth,
      landfillKgPerWeek: formData.landfillKgPerWeek,
    }

    const dietType: DietType =
      formData.diet === 'pescatarian' ? formData.diet : (formData.diet as DietType)

    const breakdown = calculateTotalFootprint(transportInput, energyInput, dietType, goodsWasteInput)
    setResults(breakdown)
    setCalculationKey((prev) => prev + 1)
    if (typeof navigator === 'undefined' || !navigator.userAgent.includes('jsdom')) {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        // Some browsers do not support smooth scrolling.
      }
    }
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSaveToHistory = () => {
    if (!results) return

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
      setHistoryKey((prev) => prev + 1)
    } else {
      setSaveMessage({ text: result.error || 'Couldn\'t save, please try again', type: 'error' })
    }
  }

  const handleDismissOnboarding = () => {
    setShowOnboarding(false)
    markOnboardingSeen()
  }

  const handleDownloadPdf = async () => {
    if (!results) return
    try {
      const { generatePersonalizedInsights } = await import('./lib/insightsEngine')
      const { generatePdfReport } = await import('./lib/pdfExport')
      const { recommendations } = await generatePersonalizedInsights(results)
      generatePdfReport(results, recommendations)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    }
  }

  const handleShare = async () => {
    if (!results) return
    const success = await shareResult(results.total)
    if (success) {
      const hasShare = typeof navigator !== 'undefined' && 'share' in navigator
      setShareMessage(hasShare ? 'Shared!' : 'Copied to clipboard!')
    }
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
        {results && (
          <section className="results-section">
            <ResultsBreakdown data={results} />
            <PersonalizedInsights key={calculationKey} breakdown={results} />
            <div className="button-group">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadPdf}
                title="Download a PDF report of your carbon footprint"
              >
                Download as PDF
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleShare}
                title="Share your carbon footprint"
              >
                Share
              </button>
            </div>
            {shareMessage && (
              <div className="share-message">
                {shareMessage}
              </div>
            )}
            <div className="button-group">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSaveToHistory}
              >
                Save this entry to my history
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setResults(null)}
              >
                Calculate Again
              </button>
            </div>
            {saveMessage && (
              <div className={`save-message save-message-${saveMessage.type}`}>
                {saveMessage.text}
              </div>
            )}
            <GoalSetting onGoalChange={() => setHistoryKey((prev) => prev + 1)} />
            <HistorySection key={historyKey} />
          </section>
        )}

        {!results && (
          <form className="carbon-form">
            <FormSection
              title="Transport"
              isOpen={openSections.transport}
              onToggle={() => toggleSection('transport')}
            >
              <FormField
                label="Car distance per week (km)"
                tooltipId="tooltip-car-distance"
                tooltipText={TOOLTIP_TEXTS.carDistance}
              >
                <input
                  type="number"
                  min="0"
                  max="5000"
                  step="0.1"
                  value={formData.carKmPerWeek}
                  onChange={(e) => handleInputChange('carKmPerWeek', e.target.value)}
                  aria-invalid={!!errors.carKmPerWeek}
                />
                {errors.carKmPerWeek && <span className="error">{errors.carKmPerWeek}</span>}
              </FormField>

              <FormField
                label="Car fuel type"
                tooltipId="tooltip-car-fuel"
                tooltipText={TOOLTIP_TEXTS.carFuel}
              >
                <select
                  value={formData.carFuelType}
                  onChange={(e) =>
                    handleInputChange('carFuelType', e.target.value as FormData['carFuelType'])
                  }
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </FormField>

              <FormField
                label="Public transit per week (km)"
                tooltipId="tooltip-transit-distance"
                tooltipText={TOOLTIP_TEXTS.transitDistance}
              >
                <input
                  type="number"
                  min="0"
                  max="5000"
                  step="0.1"
                  value={formData.transitKmPerWeek}
                  onChange={(e) => handleInputChange('transitKmPerWeek', e.target.value)}
                  aria-invalid={!!errors.transitKmPerWeek}
                />
                {errors.transitKmPerWeek && <span className="error">{errors.transitKmPerWeek}</span>}
              </FormField>

              <FormField
                label="Short-haul flights per year"
                tooltipId="tooltip-short-flights"
                tooltipText={TOOLTIP_TEXTS.shortFlights}
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.shortFlightsPerYear}
                  onChange={(e) => handleInputChange('shortFlightsPerYear', e.target.value)}
                  aria-invalid={!!errors.shortFlightsPerYear}
                />
                {errors.shortFlightsPerYear && (
                  <span className="error">{errors.shortFlightsPerYear}</span>
                )}
              </FormField>

              <FormField
                label="Long-haul flights per year"
                tooltipId="tooltip-long-flights"
                tooltipText={TOOLTIP_TEXTS.longFlights}
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.longFlightsPerYear}
                  onChange={(e) => handleInputChange('longFlightsPerYear', e.target.value)}
                  aria-invalid={!!errors.longFlightsPerYear}
                />
                {errors.longFlightsPerYear && (
                  <span className="error">{errors.longFlightsPerYear}</span>
                )}
              </FormField>
            </FormSection>

            <FormSection
              title="Home Energy"
              isOpen={openSections.energy}
              onToggle={() => toggleSection('energy')}
            >
              <FormField
                label="Electricity per month (kWh)"
                tooltipId="tooltip-electricity"
                tooltipText={TOOLTIP_TEXTS.electricity}
              >
                <input
                  type="number"
                  min="0"
                  max="2000"
                  step="1"
                  value={formData.electricityKwhPerMonth}
                  onChange={(e) => handleInputChange('electricityKwhPerMonth', e.target.value)}
                  aria-invalid={!!errors.electricityKwhPerMonth}
                />
                {errors.electricityKwhPerMonth && (
                  <span className="error">{errors.electricityKwhPerMonth}</span>
                )}
              </FormField>

              <FormField
                label="Natural gas per month (kWh)"
                tooltipId="tooltip-gas"
                tooltipText={TOOLTIP_TEXTS.gas}
              >
                <input
                  type="number"
                  min="0"
                  max="2000"
                  step="1"
                  value={formData.gasKwhPerMonth}
                  onChange={(e) => handleInputChange('gasKwhPerMonth', e.target.value)}
                  aria-invalid={!!errors.gasKwhPerMonth}
                />
                {errors.gasKwhPerMonth && (
                  <span className="error">{errors.gasKwhPerMonth}</span>
                )}
              </FormField>

              <FormField
                label="People in household"
                tooltipId="tooltip-household"
                tooltipText={TOOLTIP_TEXTS.household}
              >
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={formData.householdSize}
                  onChange={(e) => handleInputChange('householdSize', e.target.value)}
                  aria-invalid={!!errors.householdSize}
                />
                {errors.householdSize && <span className="error">{errors.householdSize}</span>}
              </FormField>
            </FormSection>

            <FormSection
              title="Diet & Consumption"
              isOpen={openSections.diet}
              onToggle={() => toggleSection('diet')}
            >
              <FormField
                label="Diet type"
                tooltipId="tooltip-diet"
                tooltipText={TOOLTIP_TEXTS.diet}
              >
                <select
                  value={formData.diet}
                  onChange={(e) => handleInputChange('diet', e.target.value as FormData['diet'])}
                >
                  <option value="vegan">Vegan</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="meatMedium">Average Meat Eater</option>
                  <option value="meatHigh">Heavy Meat Eater</option>
                </select>
              </FormField>

              <FormField
                label="Goods spending per month (£/USD)"
                tooltipId="tooltip-goods"
                tooltipText={TOOLTIP_TEXTS.goods}
              >
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="10"
                  value={formData.goodsSpendingPerMonth}
                  onChange={(e) => handleInputChange('goodsSpendingPerMonth', e.target.value)}
                  aria-invalid={!!errors.goodsSpendingPerMonth}
                />
                {errors.goodsSpendingPerMonth && (
                  <span className="error">{errors.goodsSpendingPerMonth}</span>
                )}
              </FormField>

              <FormField
                label="Landfill waste per week (kg)"
                tooltipId="tooltip-waste"
                tooltipText={TOOLTIP_TEXTS.waste}
              >
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  value={formData.landfillKgPerWeek}
                  onChange={(e) => handleInputChange('landfillKgPerWeek', e.target.value)}
                  aria-invalid={!!errors.landfillKgPerWeek}
                />
                {errors.landfillKgPerWeek && (
                  <span className="error">{errors.landfillKgPerWeek}</span>
                )}
              </FormField>
            </FormSection>

            <button type="button" className="btn-primary" onClick={handleCalculate}>
              Calculate my footprint
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

export default App
