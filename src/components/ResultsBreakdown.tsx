import { memo } from 'react'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'
import { GLOBAL_AVERAGE, SUSTAINABLE_TARGET } from '../constants/emissionTargets'
import './ResultsBreakdown.css'

interface ResultsBreakdownProps {
  data: CarbonFootprintBreakdown
}

interface CategorySummary {
  label: string
  value: number
  color: string
}

interface StatusSummary {
  className: string
  text: string
  icon: string
}

interface TableRow {
  detail: string
  value: number
}

interface TableSection {
  category: string
  rowSpan: number
  rows: TableRow[]
}

function buildCategorySummaries(data: CarbonFootprintBreakdown): CategorySummary[] {
  return [
    { label: 'Transport', value: data.transport, color: '#1d4ed8' },
    { label: 'Home Energy', value: data.homeEnergy, color: '#c2410c' },
    { label: 'Diet', value: data.diet, color: '#15803d' },
    { label: 'Goods & Waste', value: data.goodsAndWaste, color: '#7e22ce' },
  ]
}

function buildStatusSummary(total: number): StatusSummary {
  if (total <= SUSTAINABLE_TARGET) {
    return {
      className: 'status-green',
      text: 'On target',
      icon: 'OK',
    }
  }

  if (total <= GLOBAL_AVERAGE) {
    return {
      className: 'status-amber',
      text: 'Above sustainable target',
      icon: '!',
    }
  }

  return {
    className: 'status-red',
    text: 'Well above global average',
    icon: 'X',
  }
}

function buildTableSections(data: CarbonFootprintBreakdown): TableSection[] {
  return [
    {
      category: 'Transport',
      rowSpan: 3,
      rows: [
        { detail: 'Car', value: data.breakdown.transportDetail.car },
        { detail: 'Public Transit', value: data.breakdown.transportDetail.transit },
        { detail: 'Flights', value: data.breakdown.transportDetail.flights },
      ],
    },
    {
      category: 'Home Energy',
      rowSpan: 2,
      rows: [
        { detail: 'Electricity', value: data.breakdown.homeEnergyDetail.electricity },
        { detail: 'Gas', value: data.breakdown.homeEnergyDetail.gas },
      ],
    },
    {
      category: 'Diet',
      rowSpan: 1,
      rows: [{ detail: 'Food & Beverages', value: data.diet }],
    },
    {
      category: 'Goods & Waste',
      rowSpan: 1,
      rows: [{ detail: 'Purchases & Landfill', value: data.goodsAndWaste }],
    },
  ]
}

function StatusBadge({ status }: { status: StatusSummary }) {
  return (
    <div className={`status-badge ${status.className}`} role="status" aria-label={`Emissions status: ${status.text}`}>
      {status.icon} {status.text}
    </div>
  )
}

function ComparisonSummary({ data }: { data: CarbonFootprintBreakdown }) {
  return (
    <p className="comparison-text">
      That is <strong>{(data.total / SUSTAINABLE_TARGET).toFixed(2)}x</strong> the sustainable target (
      {SUSTAINABLE_TARGET}t) and <strong>{(data.total / GLOBAL_AVERAGE).toFixed(2)}x</strong> the global average (
      {GLOBAL_AVERAGE}t)
    </p>
  )
}

function CategoryChart({
  categories,
  maxValue,
  ariaLabel,
}: {
  categories: CategorySummary[]
  maxValue: number
  ariaLabel: string
}) {
  return (
    <div className="breakdown-chart" role="img" aria-label={ariaLabel}>
      <h3>Breakdown by Category</h3>
      <div className="chart-bars">
        {categories.map((category) => (
          <div key={category.label} className="chart-bar-wrapper">
            <div
              className="chart-bar"
              style={{
                width: `${maxValue > 0 ? (category.value / maxValue) * 100 : 0}%`,
                backgroundColor: category.color,
              }}
              aria-label={`${category.label} emissions ${category.value.toFixed(2)} tonnes`}
            >
              <span className="bar-label">
                {category.label}: {category.value.toFixed(2)}t
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailedBreakdownTable({ sections }: { sections: TableSection[] }) {
  return (
    <div className="breakdown-table">
      <h3>Detailed Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Details</th>
            <th scope="col">Emissions (t CO2e)</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) =>
            section.rows.map((row, index) => (
              <tr key={`${section.category}-${row.detail}`}>
                {index === 0 && (
                  <td rowSpan={section.rowSpan}>{section.category}</td>
                )}
                <td>{row.detail}</td>
                <td>{row.value.toFixed(3)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}

function ResultsSummary({ data }: { data: CarbonFootprintBreakdown }) {
  const status = buildStatusSummary(data.total)
  const categories = buildCategorySummaries(data)
  const maxValue = Math.max(...categories.map((category) => category.value), 0)

  return (
    <>
      <div className="total-result">
        <span className="total-number">{data.total.toFixed(2)}</span>
        <span className="total-unit">t CO2e/year</span>
      </div>

      <StatusBadge status={status} />
      <ComparisonSummary data={data} />
      <CategoryChart
        categories={categories}
        maxValue={maxValue}
        ariaLabel={`Category breakdown chart for transport ${data.transport.toFixed(2)} tonnes, home energy ${data.homeEnergy.toFixed(2)} tonnes, diet ${data.diet.toFixed(2)} tonnes, and goods and waste ${data.goodsAndWaste.toFixed(2)} tonnes`}
      />
      <DetailedBreakdownTable sections={buildTableSections(data)} />
    </>
  )
}

function ResultsBreakdownComponent({ data }: ResultsBreakdownProps) {
  return (
    <div className="results-container" role="region" aria-live="polite" aria-label="Carbon footprint results">
      <ResultsSummary data={data} />
    </div>
  )
}

export const ResultsBreakdown = memo(ResultsBreakdownComponent)
