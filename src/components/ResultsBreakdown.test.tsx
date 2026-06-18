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
    expect(screen.getByText('t CO2e/year')).toBeInTheDocument()
  })

  it('shows correct status badge for emissions above the global average', () => {
    render(<ResultsBreakdown data={mockData} />)
    expect(screen.getByRole('status', { name: /Emissions status: Well above global average/ })).toBeInTheDocument()
  })

  it('shows an amber status badge when the footprint is above target but below the global average', () => {
    const midData: CarbonFootprintBreakdown = {
      total: 3.2,
      transport: 1.2,
      homeEnergy: 0.8,
      diet: 0.7,
      goodsAndWaste: 0.5,
      breakdown: {
        transportDetail: {
          car: 0.8,
          transit: 0.3,
          flights: 0.1,
        },
        homeEnergyDetail: {
          electricity: 0.5,
          gas: 0.3,
        },
      },
    }

    render(<ResultsBreakdown data={midData} />)

    expect(screen.getByRole('status', { name: /Emissions status: Above sustainable target/ })).toBeInTheDocument()
  })

  it('displays all four category breakdowns in chart', () => {
    render(<ResultsBreakdown data={mockData} />)
    expect(screen.getByRole('img', { name: /Category breakdown chart/ })).toBeInTheDocument()
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

  it('shows a green status badge and zero-width bars for a zero footprint', () => {
    const zeroData: CarbonFootprintBreakdown = {
      total: 0,
      transport: 0,
      homeEnergy: 0,
      diet: 0,
      goodsAndWaste: 0,
      breakdown: {
        transportDetail: {
          car: 0,
          transit: 0,
          flights: 0,
        },
        homeEnergyDetail: {
          electricity: 0,
          gas: 0,
        },
      },
    }

    render(<ResultsBreakdown data={zeroData} />)

    expect(screen.getByRole('status', { name: /Emissions status: On target/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Category breakdown chart/ })).toBeInTheDocument()
    expect(screen.getByText(/Transport: 0.00t/)).toBeInTheDocument()
    expect(screen.getByText(/Goods & Waste: 0.00t/)).toBeInTheDocument()
  })

  it('shows a red status badge for a footprint well above the global average', () => {
    const highData: CarbonFootprintBreakdown = {
      total: 12,
      transport: 4,
      homeEnergy: 3,
      diet: 3,
      goodsAndWaste: 2,
      breakdown: {
        transportDetail: {
          car: 2,
          transit: 1,
          flights: 1,
        },
        homeEnergyDetail: {
          electricity: 2,
          gas: 1,
        },
      },
    }

    render(<ResultsBreakdown data={highData} />)

    expect(screen.getByRole('status', { name: /Emissions status: Well above global average/ })).toBeInTheDocument()
    expect(screen.getByText(/6.00x/)).toBeInTheDocument()
  })
})
