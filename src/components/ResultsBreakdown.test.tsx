import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsBreakdown } from './ResultsBreakdown'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'

const mockData: CarbonFootprintBreakdown = {
  total: 5.6,
  transport: 2.0,
  homeEnergy: 1.5,
  diet: 1.3,
  goodsAndWaste: 0.8,
  breakdown: {
    transportDetail: {
      car: 1.2,
      transit: 0.5,
      flights: 0.3,
    },
    homeEnergyDetail: {
      electricity: 0.9,
      gas: 0.6,
    },
  },
}

describe('ResultsBreakdown', () => {
  it('renders total emissions with correct value', () => {
    render(<ResultsBreakdown data={mockData} />)
    expect(screen.getByText('5.60')).toBeInTheDocument()
    expect(screen.getByText('t CO₂e/year')).toBeInTheDocument()
  })

  it('shows correct status badge for above average emissions', () => {
    render(<ResultsBreakdown data={mockData} />)
    expect(screen.getByText(/Above sustainable target/)).toBeInTheDocument()
  })

  it('displays all four category breakdowns in chart', () => {
    render(<ResultsBreakdown data={mockData} />)
    expect(screen.getByText(/Transport: 2.00t/)).toBeInTheDocument()
    expect(screen.getByText(/Home Energy: 1.50t/)).toBeInTheDocument()
    expect(screen.getByText(/Diet: 1.30t/)).toBeInTheDocument()
    expect(screen.getByText(/Goods & Waste: 0.80t/)).toBeInTheDocument()
  })

  it('calculates comparison ratios correctly', () => {
    render(<ResultsBreakdown data={mockData} />)
    const globalCompare = (5.6 / 4.7).toFixed(2)
    const targetCompare = (5.6 / 2).toFixed(2)
    expect(screen.getByText(new RegExp(`${targetCompare}x`))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${globalCompare}x`))).toBeInTheDocument()
  })

  it('displays detailed breakdown table with all emissions details', () => {
    render(<ResultsBreakdown data={mockData} />)
    expect(screen.getByText('Car')).toBeInTheDocument()
    expect(screen.getByText('1.200')).toBeInTheDocument()
    expect(screen.getByText('Public Transit')).toBeInTheDocument()
    expect(screen.getByText('0.500')).toBeInTheDocument()
    expect(screen.getByText('Electricity')).toBeInTheDocument()
  })
})
