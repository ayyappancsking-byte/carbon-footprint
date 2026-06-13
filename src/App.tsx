import { useState } from 'react'
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

function Tooltip({
  text,
  id,
}: {
  text: string
  id: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span className="tooltip-wrapper">
      <button
        type="button"
        className="tooltip-btn"
        aria-describedby={id}
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
        <Tooltip text={tooltipText} id={tooltipId} />
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
  return (
    <fieldset className={`form-section ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="section-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
        <legend>{title}</legend>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </fieldset>
  )
}

function ResultsBreakdown({ data }: { data: CarbonFootprintBreakdown }) {
  const categories = [
    { label: 'Transport', value: data.transport, color: '#2563eb' },
    { label: 'Home Energy', value: data.homeEnergy, color: '#f97316' },
    { label: 'Diet', value: data.diet, color: '#22c55e' },
    { label: 'Goods & Waste', value: data.goodsAndWaste, color: '#a855f7' },
  ]

  const maxValue = Math.max(...categories.map((c) => c.value))
  const sustainableTarget = 2
  const globalAverage = 4.7

  let statusClass = 'status-green'
  let statusText = 'On target'
  if (data.total > globalAverage * 1.5) {
    statusClass = 'status-red'
    statusText = 'Well above global average'
  } else if (data.total > sustainableTarget * 1.5) {
    statusClass = 'status-amber'
    statusText = 'Above sustainable target'
  }

  const globalCompare = (data.total / globalAverage).toFixed(2)
  const targetCompare = (data.total / sustainableTarget).toFixed(2)

  return (
    <div className="results-container" role="region" aria-live="polite" aria-label="Carbon footprint results">
      <div className="total-result">
        <span className="total-number">{data.total.toFixed(2)}</span>
        <span className="total-unit">t CO₂e/year</span>
      </div>

      <div className={`status-badge ${statusClass}`}>{statusText}</div>

      <p className="comparison-text">
        That is <strong>{targetCompare}x</strong> the sustainable target (2t) and{' '}
        <strong>{globalCompare}x</strong> the global average (4.7t)
      </p>

      <div className="breakdown-chart">
        <h3>Breakdown by Category</h3>
        <div className="chart-bars">
          {categories.map((cat) => (
            <div key={cat.label} className="chart-bar-wrapper">
              <div
                className="chart-bar"
                style={{
                  width: `${(cat.value / maxValue) * 100}%`,
                  backgroundColor: cat.color,
                }}
              >
                <span className="bar-label">
                  {cat.label}: {cat.value.toFixed(2)}t
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="breakdown-table">
        <h3>Detailed Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Details</th>
              <th>Emissions (t CO₂e)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={3}>Transport</td>
              <td>Car</td>
              <td>{data.breakdown.transportDetail.car.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Public Transit</td>
              <td>{data.breakdown.transportDetail.transit.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Flights</td>
              <td>{data.breakdown.transportDetail.flights.toFixed(3)}</td>
            </tr>
            <tr>
              <td rowSpan={2}>Home Energy</td>
              <td>Electricity</td>
              <td>{data.breakdown.homeEnergyDetail.electricity.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Gas</td>
              <td>{data.breakdown.homeEnergyDetail.gas.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Diet</td>
              <td>Food & Beverages</td>
              <td>{data.diet.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Goods & Waste</td>
              <td>Purchases & Landfill</td>
              <td>{data.goodsAndWaste.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (formData.carKmPerWeek < 0 || formData.carKmPerWeek > 5000) {
      newErrors.carKmPerWeek = 'Car distance must be between 0-5000 km/week'
    }
    if (formData.transitKmPerWeek < 0 || formData.transitKmPerWeek > 5000) {
      newErrors.transitKmPerWeek = 'Transit distance must be between 0-5000 km/week'
    }
    if (formData.shortFlightsPerYear < 0 || formData.shortFlightsPerYear > 100) {
      newErrors.shortFlightsPerYear = 'Short-haul flights must be between 0-100/year'
    }
    if (formData.longFlightsPerYear < 0 || formData.longFlightsPerYear > 100) {
      newErrors.longFlightsPerYear = 'Long-haul flights must be between 0-100/year'
    }
    if (formData.electricityKwhPerMonth < 0 || formData.electricityKwhPerMonth > 2000) {
      newErrors.electricityKwhPerMonth = 'Electricity must be between 0-2000 kWh/month'
    }
    if (formData.gasKwhPerMonth < 0 || formData.gasKwhPerMonth > 2000) {
      newErrors.gasKwhPerMonth = 'Gas must be between 0-2000 kWh/month'
    }
    if (formData.householdSize < 1 || formData.householdSize > 20) {
      newErrors.householdSize = 'Household size must be between 1-20'
    }
    if (formData.goodsSpendingPerMonth < 0 || formData.goodsSpendingPerMonth > 10000) {
      newErrors.goodsSpendingPerMonth = 'Goods spending must be between 0-10000/month'
    }
    if (formData.landfillKgPerWeek < 0 || formData.landfillKgPerWeek > 200) {
      newErrors.landfillKgPerWeek = 'Landfill waste must be between 0-200 kg/week'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (key: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value,
    }))
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Carbon Footprint Awareness Platform</h1>
        <p className="subtitle">Understand, track, and reduce your carbon footprint.</p>
      </header>

      <main className="main-content">
        {results && (
          <section className="results-section">
            <ResultsBreakdown data={results} />
            <PersonalizedInsights breakdown={results} />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setResults(null)}
            >
              Calculate Again
            </button>
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
