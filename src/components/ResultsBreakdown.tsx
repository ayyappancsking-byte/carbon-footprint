import { useMemo } from 'react'
import React from 'react'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'
import { SUSTAINABLE_TARGET, GLOBAL_AVERAGE } from '../constants/emissionTargets'
import './ResultsBreakdown.css'

interface ResultsBreakdownProps {
  data: CarbonFootprintBreakdown
}

function ResultsBreakdownComponent({ data }: ResultsBreakdownProps) {
  const categories = useMemo(
    () => [
      { label: 'Transport', value: data.transport, color: '#2563eb' },
      { label: 'Home Energy', value: data.homeEnergy, color: '#f97316' },
      { label: 'Diet', value: data.diet, color: '#22c55e' },
      { label: 'Goods & Waste', value: data.goodsAndWaste, color: '#a855f7' },
    ],
    [data.transport, data.homeEnergy, data.diet, data.goodsAndWaste]
  )

  const maxValue = useMemo(
    () => Math.max(...categories.map((c) => c.value), 0),
    [categories]
  )

  let statusClass = 'status-green'
  let statusText = 'On target'
  if (data.total > GLOBAL_AVERAGE * 1.5) {
    statusClass = 'status-red'
    statusText = 'Well above global average'
  } else if (data.total > SUSTAINABLE_TARGET * 1.5) {
    statusClass = 'status-amber'
    statusText = 'Above sustainable target'
  }

  const globalCompare = (data.total / GLOBAL_AVERAGE).toFixed(2)
  const targetCompare = (data.total / SUSTAINABLE_TARGET).toFixed(2)

  return (
    <div className="results-container" role="region" aria-live="polite" aria-label="Carbon footprint results">
      <div className="total-result">
        <span className="total-number">{data.total.toFixed(2)}</span>
        <span className="total-unit">t CO₂e/year</span>
      </div>

      <div className={`status-badge ${statusClass}`} role="status" aria-label={`Emissions status: ${statusText}`}>
        {statusClass === 'status-green' ? '✓' : statusClass === 'status-amber' ? '⚠' : '✗'} {statusText}
      </div>

      <p className="comparison-text">
        That is <strong>{targetCompare}x</strong> the sustainable target ({SUSTAINABLE_TARGET}t) and{' '}
        <strong>{globalCompare}x</strong> the global average ({GLOBAL_AVERAGE}t)
      </p>

      <div className="breakdown-chart">
        <h3>Breakdown by Category</h3>
        <div className="chart-bars">
          {categories.map((cat) => (
            <div key={cat.label} className="chart-bar-wrapper">
              <div
                className="chart-bar"
                style={{
                  width: `${maxValue > 0 ? (cat.value / maxValue) * 100 : 0}%`,
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
              <th scope="col">Category</th>
              <th scope="col">Details</th>
              <th scope="col">Emissions (t CO₂e)</th>
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

export const ResultsBreakdown = React.memo(ResultsBreakdownComponent)
