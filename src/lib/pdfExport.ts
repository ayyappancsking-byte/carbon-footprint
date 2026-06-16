import jsPDF from 'jspdf'
import type { CarbonFootprintBreakdown } from './carbonEngine'
import type { Recommendation } from './insightsEngine'
import { SUSTAINABLE_TARGET, GLOBAL_AVERAGE } from '../constants/emissionTargets'

export function generatePdfReport(
  breakdown: CarbonFootprintBreakdown,
  recommendations: Recommendation[],
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  const setYPosition = (offset: number) => {
    yPosition += offset
  }

  doc.setFontSize(20)
  doc.text('My Carbon Footprint Report', margin, yPosition)
  setYPosition(10)

  doc.setFontSize(10)
  doc.setTextColor(100)
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Generated: ${today}`, margin, yPosition)
  setYPosition(10)

  doc.setTextColor(0)
  doc.setFontSize(14)
  doc.text(`Total: ${breakdown.total.toFixed(2)} tCO₂e/year`, margin, yPosition)
  setYPosition(6)

  doc.setFontSize(10)
  doc.setTextColor(80)
  const targetCompare = (breakdown.total / SUSTAINABLE_TARGET).toFixed(2)
  const globalCompare = (breakdown.total / GLOBAL_AVERAGE).toFixed(2)

  doc.text(
    `${targetCompare}x sustainable target (${SUSTAINABLE_TARGET}t) • ${globalCompare}x global average (${GLOBAL_AVERAGE}t)`,
    margin,
    yPosition,
  )
  setYPosition(12)

  doc.setTextColor(0)
  doc.setFontSize(12)
  doc.text('Breakdown by Category', margin, yPosition)
  setYPosition(8)

  const categories = [
    { label: 'Transport', value: breakdown.transport },
    { label: 'Home Energy', value: breakdown.homeEnergy },
    { label: 'Diet', value: breakdown.diet },
    { label: 'Goods & Waste', value: breakdown.goodsAndWaste },
  ]

  doc.setFontSize(9)
  categories.forEach((cat) => {
    doc.text(`${cat.label}: ${cat.value.toFixed(2)}t`, margin + 5, yPosition)
    setYPosition(5)
  })

  setYPosition(5)

  doc.setFontSize(12)
  doc.text('Top Recommendations', margin, yPosition)
  setYPosition(8)

  doc.setFontSize(9)
  const topRecommendations = recommendations.slice(0, 3)
  topRecommendations.forEach((rec, index) => {
    const maxWidth = contentWidth - 10
    const wrappedText = doc.splitTextToSize(`${index + 1}. ${rec.action}`, maxWidth)

    wrappedText.forEach((line: string) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin + 5, yPosition)
      setYPosition(5)
    })

    setYPosition(2)
  })

  doc.save('carbon-footprint-report.pdf')
}
