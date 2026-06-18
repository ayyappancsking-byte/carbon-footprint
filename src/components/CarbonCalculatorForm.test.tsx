import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CalculatorForm } from './CarbonCalculatorForm'
import type { FormData, FormErrors, SectionKey } from './calculatorTypes'

const formData: FormData = {
  carKmPerWeek: 120,
  carFuelType: 'petrol',
  transitKmPerWeek: 30,
  shortFlightsPerYear: 2,
  longFlightsPerYear: 1,
  electricityKwhPerMonth: 180,
  gasKwhPerMonth: 40,
  householdSize: 3,
  diet: 'meatMedium',
  goodsSpendingPerMonth: 200,
  landfillKgPerWeek: 12,
}

const openSections: Record<SectionKey, boolean> = {
  transport: true,
  energy: true,
  diet: true,
}

describe('CalculatorForm', () => {
  it('renders open sections, exposes tooltips, and forwards toggle events', () => {
    const onToggleSection = vi.fn()

    render(
      <CalculatorForm
        formData={formData}
        errors={{}}
        openSections={openSections}
        onToggleSection={onToggleSection}
        onFieldChange={vi.fn()}
        onCalculate={vi.fn()}
      />,
    )

    const transportToggle = screen.getByRole('button', { name: /Collapse Transport section/i })
    expect(transportToggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(transportToggle)
    expect(onToggleSection).toHaveBeenCalledWith('transport')

    const energyToggle = screen.getByRole('button', { name: /Collapse Home Energy section/i })
    fireEvent.click(energyToggle)
    expect(onToggleSection).toHaveBeenCalledWith('energy')

    const dietToggle = screen.getByRole('button', { name: /Collapse Diet & Consumption section/i })
    fireEvent.click(dietToggle)
    expect(onToggleSection).toHaveBeenCalledWith('diet')

    const tooltipButton = screen.getByRole('button', {
      name: /More information about Car distance per week \(km\)/i,
    })
    fireEvent.click(tooltipButton)

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Average distance you drive per week. Include commute, shopping, leisure.',
    )
    expect(tooltipButton).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(tooltipButton)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(tooltipButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('hides collapsed sections when they are closed', () => {
    render(
      <CalculatorForm
        formData={formData}
        errors={{}}
        openSections={{ transport: false, energy: false, diet: false }}
        onToggleSection={vi.fn()}
        onFieldChange={vi.fn()}
        onCalculate={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText(/Car distance per week in kilometres/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Expand Transport section/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('shows inline errors for invalid numeric values', () => {
    const errors: FormErrors = {
      carKmPerWeek: 'Car distance must be between 0-5000 km/week',
    }

    render(
      <CalculatorForm
        formData={formData}
        errors={errors}
        openSections={openSections}
        onToggleSection={vi.fn()}
        onFieldChange={vi.fn()}
        onCalculate={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Car distance must be between 0-5000 km/week')
  })

  it('forwards numeric, select, and calculate events', () => {
    const onFieldChange = vi.fn()
    const onCalculate = vi.fn()

    render(
      <CalculatorForm
        formData={formData}
        errors={{}}
        openSections={openSections}
        onToggleSection={vi.fn()}
        onFieldChange={onFieldChange}
        onCalculate={onCalculate}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Car distance per week in kilometres/i), {
      target: { value: '42' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /Car fuel type/i }), {
      target: { value: 'diesel' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /Diet type/i }), {
      target: { value: 'pescatarian' },
    })

    expect(onFieldChange).toHaveBeenCalledWith('carKmPerWeek', '42')
    expect(onFieldChange).toHaveBeenCalledWith('carFuelType', 'diesel')
    expect(onFieldChange).toHaveBeenCalledWith('diet', 'pescatarian')

    fireEvent.click(screen.getByRole('button', { name: /Calculate my carbon footprint/i }))
    expect(onCalculate).toHaveBeenCalledOnce()
  })
})
