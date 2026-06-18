import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'

export type DietOption = 'vegan' | 'vegetarian' | 'pescatarian' | 'meatMedium' | 'meatHigh'

export interface FormData {
  carKmPerWeek: number
  carFuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric'
  transitKmPerWeek: number
  shortFlightsPerYear: number
  longFlightsPerYear: number
  electricityKwhPerMonth: number
  gasKwhPerMonth: number
  householdSize: number
  diet: DietOption
  goodsSpendingPerMonth: number
  landfillKgPerWeek: number
}

export type FormErrors = Partial<Record<keyof FormData, string>>
export type SectionKey = 'transport' | 'energy' | 'diet'

export interface MessageState {
  text: string
  type: 'success' | 'error'
}

export interface FormControlsProps {
  formData: FormData
  errors: FormErrors
  onFieldChange: (key: keyof FormData, value: string | number) => void
}

export interface CalculatorFormProps extends FormControlsProps {
  openSections: Record<SectionKey, boolean>
  onToggleSection: (section: SectionKey) => void
  onCalculate: () => void
}

export interface ResultsPanelProps {
  results: CarbonFootprintBreakdown
  calculationRevision: number
  saveMessage: MessageState | null
  actionMessage: MessageState | null
  onDownloadPdf: () => Promise<void>
  onShare: () => Promise<void>
  onSaveToHistory: () => void
  onCalculateAgain: () => void
}
