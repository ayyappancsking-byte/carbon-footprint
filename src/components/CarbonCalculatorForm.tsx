import type { ReactNode } from 'react'
import { useState } from 'react'
import type { CalculatorFormProps, FormControlsProps } from './calculatorTypes'
import {
  createSectionId,
  getDescribedBy,
  TOOLTIP_TEXTS,
  type NumericFieldKey,
} from './calculatorConfig'

interface TooltipProps {
  label: string
  text: string
  id: string
}

interface FormFieldProps {
  fieldId: string
  label: string
  tooltipId: string
  tooltipText: string
  error?: string
  children: ReactNode
}

interface SectionProps {
  title: string
  children: ReactNode
  isOpen: boolean
  onToggle: () => void
}

interface NumberFieldConfig {
  fieldKey: NumericFieldKey
  id: string
  label: string
  tooltipId: string
  tooltipText: string
  min: number
  max: number
  step: string
  ariaLabel: string
  placeholder?: string
}

interface NumberFieldProps {
  config: NumberFieldConfig
  value: number
  error?: string
  onChange: (fieldKey: NumericFieldKey, value: string) => void
}

interface SelectFieldConfig {
  fieldKey: 'carFuelType' | 'diet'
  id: string
  label: string
  tooltipId: string
  tooltipText: string
  ariaLabel: string
  options: Array<{ value: string; label: string }>
}

interface SelectFieldProps {
  config: SelectFieldConfig
  value: string
  onChange: (fieldKey: 'carFuelType' | 'diet', value: string) => void
}

const TRANSPORT_NUMBER_FIELDS: NumberFieldConfig[] = [
  {
    fieldKey: 'carKmPerWeek',
    id: 'car-distance',
    label: 'Car distance per week (km)',
    tooltipId: 'tooltip-car-distance',
    tooltipText: TOOLTIP_TEXTS.carDistance,
    min: 0,
    max: 5000,
    step: '0.1',
    ariaLabel: 'Car distance per week in kilometres',
  },
  {
    fieldKey: 'transitKmPerWeek',
    id: 'transit-distance',
    label: 'Public transit per week (km)',
    tooltipId: 'tooltip-transit-distance',
    tooltipText: TOOLTIP_TEXTS.transitDistance,
    min: 0,
    max: 5000,
    step: '0.1',
    ariaLabel: 'Public transit distance per week in kilometres',
  },
  {
    fieldKey: 'shortFlightsPerYear',
    id: 'short-flights',
    label: 'Short-haul flights per year',
    tooltipId: 'tooltip-short-flights',
    tooltipText: TOOLTIP_TEXTS.shortFlights,
    min: 0,
    max: 100,
    step: '1',
    ariaLabel: 'Short-haul flights per year',
  },
  {
    fieldKey: 'longFlightsPerYear',
    id: 'long-flights',
    label: 'Long-haul flights per year',
    tooltipId: 'tooltip-long-flights',
    tooltipText: TOOLTIP_TEXTS.longFlights,
    min: 0,
    max: 100,
    step: '1',
    ariaLabel: 'Long-haul flights per year',
  },
]

const ENERGY_NUMBER_FIELDS: NumberFieldConfig[] = [
  {
    fieldKey: 'electricityKwhPerMonth',
    id: 'electricity',
    label: 'Electricity per month (kWh)',
    tooltipId: 'tooltip-electricity',
    tooltipText: TOOLTIP_TEXTS.electricity,
    min: 0,
    max: 2000,
    step: '1',
    ariaLabel: 'Electricity use per month in kilowatt hours',
  },
  {
    fieldKey: 'gasKwhPerMonth',
    id: 'gas',
    label: 'Natural gas per month (kWh)',
    tooltipId: 'tooltip-gas',
    tooltipText: TOOLTIP_TEXTS.gas,
    min: 0,
    max: 2000,
    step: '1',
    ariaLabel: 'Natural gas use per month in kilowatt hours',
  },
  {
    fieldKey: 'householdSize',
    id: 'household-size',
    label: 'People in household',
    tooltipId: 'tooltip-household',
    tooltipText: TOOLTIP_TEXTS.household,
    min: 1,
    max: 20,
    step: '1',
    ariaLabel: 'Number of people in the household',
  },
]

const CONSUMPTION_NUMBER_FIELDS: NumberFieldConfig[] = [
  {
    fieldKey: 'goodsSpendingPerMonth',
    id: 'goods-spending',
    label: 'Goods spending per month (GBP)',
    tooltipId: 'tooltip-goods',
    tooltipText: TOOLTIP_TEXTS.goods,
    min: 0,
    max: 10000,
    step: '10',
    ariaLabel: 'Goods spending per month in GBP',
  },
  {
    fieldKey: 'landfillKgPerWeek',
    id: 'landfill-waste',
    label: 'Landfill waste per week (kg)',
    tooltipId: 'tooltip-waste',
    tooltipText: TOOLTIP_TEXTS.waste,
    min: 0,
    max: 200,
    step: '0.1',
    ariaLabel: 'Landfill waste per week in kilograms',
  },
]

const CAR_FUEL_FIELD: SelectFieldConfig = {
  fieldKey: 'carFuelType',
  id: 'car-fuel-type',
  label: 'Car fuel type',
  tooltipId: 'tooltip-car-fuel',
  tooltipText: TOOLTIP_TEXTS.carFuel,
  ariaLabel: 'Car fuel type',
  options: [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'electric', label: 'Electric' },
  ],
}

const DIET_FIELD: SelectFieldConfig = {
  fieldKey: 'diet',
  id: 'diet',
  label: 'Diet type',
  tooltipId: 'tooltip-diet',
  tooltipText: TOOLTIP_TEXTS.diet,
  ariaLabel: 'Diet type',
  options: [
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'pescatarian', label: 'Pescatarian' },
    { value: 'meatMedium', label: 'Average Meat Eater' },
    { value: 'meatHigh', label: 'Heavy Meat Eater' },
  ],
}

/**
 * Small info button that reveals an inline tooltip.
 */
function Tooltip({ label, text, id }: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const popupId = `${id}-popup`

  return (
    <span className="tooltip-wrapper">
      <button
        type="button"
        className="tooltip-btn"
        aria-label={`More information about ${label}`}
        aria-expanded={showTooltip}
        aria-controls={popupId}
        aria-describedby={showTooltip ? popupId : undefined}
        onClick={() => setShowTooltip((prev) => !prev)}
      >
        i
      </button>
      {showTooltip && (
        <div className="tooltip" id={popupId} role="tooltip">
          {text}
        </div>
      )}
    </span>
  )
}

/**
 * Wrapper for a label, tooltip, field, and inline error.
 */
function FormField({ fieldId, label, tooltipId, tooltipText, error, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <div className="field-label-row">
        <label htmlFor={fieldId}>{label}</label>
        <Tooltip label={label} text={tooltipText} id={tooltipId} />
      </div>
      <span id={tooltipId} className="sr-only">
        {tooltipText}
      </span>
      {children}
      {error && (
        <span className="error" id={`${fieldId}-error`} role="alert" aria-live="assertive">
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * Expandable section used by the calculator form.
 */
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
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <span className="toggle-icon" aria-hidden="true">
          {isOpen ? '-' : '+'}
        </span>
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

/**
 * Generic numeric input field.
 */
function NumberField({ config, value, error, onChange }: NumberFieldProps) {
  return (
    <FormField
      fieldId={config.id}
      label={config.label}
      tooltipId={config.tooltipId}
      tooltipText={config.tooltipText}
      error={error}
    >
      <input
        id={config.id}
        type="number"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(event) => onChange(config.fieldKey, event.target.value)}
        placeholder={config.placeholder}
        aria-label={config.ariaLabel}
        aria-invalid={Boolean(error)}
        aria-describedby={getDescribedBy(config.id, config.tooltipId, error)}
      />
    </FormField>
  )
}

/**
 * Generic select field.
 */
function SelectField({ config, value, onChange }: SelectFieldProps) {
  return (
    <FormField fieldId={config.id} label={config.label} tooltipId={config.tooltipId} tooltipText={config.tooltipText}>
      <select
        id={config.id}
        value={value}
        onChange={(event) => onChange(config.fieldKey, event.target.value)}
        aria-label={config.ariaLabel}
        aria-describedby={config.tooltipId}
      >
        {config.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

/**
 * Render a group of numeric fields.
 */
function NumberFieldGroup({
  fields,
  formData,
  errors,
  onFieldChange,
}: FormControlsProps & { fields: NumberFieldConfig[] }) {
  return (
    <>
      {fields.map((field) => (
        <NumberField
          key={field.id}
          config={field}
          value={formData[field.fieldKey]}
          error={errors[field.fieldKey]}
          onChange={onFieldChange as (fieldKey: NumericFieldKey, value: string) => void}
        />
      ))}
    </>
  )
}

function TransportFields(props: FormControlsProps) {
  return (
    <>
      <NumberFieldGroup fields={TRANSPORT_NUMBER_FIELDS} {...props} />
      <SelectField config={CAR_FUEL_FIELD} value={props.formData.carFuelType} onChange={props.onFieldChange as SelectFieldProps['onChange']} />
    </>
  )
}

function EnergyFields(props: FormControlsProps) {
  return <NumberFieldGroup fields={ENERGY_NUMBER_FIELDS} {...props} />
}

function ConsumptionFields(props: FormControlsProps) {
  return (
    <>
      <SelectField config={DIET_FIELD} value={props.formData.diet} onChange={props.onFieldChange as SelectFieldProps['onChange']} />
      <NumberFieldGroup fields={CONSUMPTION_NUMBER_FIELDS} {...props} />
    </>
  )
}

/**
 * Build the full calculator form.
 */
export function CalculatorForm({
  formData,
  errors,
  openSections,
  onToggleSection,
  onFieldChange,
  onCalculate,
}: CalculatorFormProps) {
  return (
    <form className="carbon-form" aria-label="Carbon footprint calculator">
      <FormSection
        title="Transport"
        isOpen={openSections.transport}
        onToggle={() => onToggleSection('transport')}
      >
        <TransportFields formData={formData} errors={errors} onFieldChange={onFieldChange} />
      </FormSection>

      <FormSection
        title="Home Energy"
        isOpen={openSections.energy}
        onToggle={() => onToggleSection('energy')}
      >
        <EnergyFields formData={formData} errors={errors} onFieldChange={onFieldChange} />
      </FormSection>

      <FormSection
        title="Diet & Consumption"
        isOpen={openSections.diet}
        onToggle={() => onToggleSection('diet')}
      >
        <ConsumptionFields formData={formData} errors={errors} onFieldChange={onFieldChange} />
      </FormSection>

      <button
        type="button"
        className="btn-primary"
        onClick={onCalculate}
        aria-label="Calculate my carbon footprint"
      >
        Calculate my footprint
      </button>
    </form>
  )
}
