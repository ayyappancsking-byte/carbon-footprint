import jsPDF from 'jspdf'
import type { CarbonFootprintBreakdown } from './carbonEngine'
import type { Recommendation } from './insightsEngine'
import { GLOBAL_AVERAGE, SUSTAINABLE_TARGET } from '../constants/emissionTargets'

interface PdfCategoryRow {
  label: string
  value: number
}

/**
 * Keep the cursor within the printable area of the current page.
 */
function ensurePageSpace(doc: jsPDF, yPosition: number, pageHeight: number, margin: number): number {
  if (yPosition > pageHeight - 15) {
    doc.addPage()
    return margin
  }

  return yPosition
}

/**
 * Build the breakdown rows displayed in the report.
 */
function buildCategoryRows(breakdown: CarbonFootprintBreakdown): PdfCategoryRow[] {
  return [
    { label: 'Transport', value: breakdown.transport },
    { label: 'Home Energy', value: breakdown.homeEnergy },
    { label: 'Diet', value: breakdown.diet },
    { label: 'Goods & Waste', value: breakdown.goodsAndWaste },
  ]
}

/**
 * Write the report header and return the next vertical cursor position.
 */
function writeHeader(doc: jsPDF, margin: number, yPosition: number): number {
  doc.setFontSize(20)
  doc.text('My Carbon Footprint Report', margin, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(100)
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Generated: ${today}`, margin, yPosition)
  yPosition += 10

  return yPosition
}

/**
 * Write the main summary block and return the next cursor position.
 */
function writeSummary(doc: jsPDF, breakdown: CarbonFootprintBreakdown, margin: number, yPosition: number): number {
  doc.setTextColor(0)
  doc.setFontSize(14)
  doc.text(`Total: ${breakdown.total.toFixed(2)} tCO2e/year`, margin, yPosition)
  yPosition += 6

  doc.setFontSize(10)
  doc.setTextColor(80)
  const targetCompare = (breakdown.total / SUSTAINABLE_TARGET).toFixed(2)
  const globalCompare = (breakdown.total / GLOBAL_AVERAGE).toFixed(2)
  doc.text(
    `${targetCompare}x sustainable target (${SUSTAINABLE_TARGET}t) | ${globalCompare}x global average (${GLOBAL_AVERAGE}t)`,
    margin,
    yPosition,
  )
  yPosition += 12

  return yPosition
}

/**
 * Write the category breakdown section and return the next cursor position.
 */
function writeCategoryBreakdown(
  doc: jsPDF,
  breakdown: CarbonFootprintBreakdown,
  margin: number,
  yPosition: number,
): number {
  doc.setTextColor(0)
  doc.setFontSize(12)
  doc.text('Breakdown by Category', margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  for (const row of buildCategoryRows(breakdown)) {
    doc.text(`${row.label}: ${row.value.toFixed(2)}t`, margin + 5, yPosition)
    yPosition += 5
  }

  return yPosition + 5
}

/**
 * Write the top recommendation section and return the next cursor position.
 */
function writeRecommendations(
  doc: jsPDF,
  recommendations: Recommendation[],
  margin: number,
  yPosition: number,
  pageHeight: number,
  contentWidth: number,
): number {
  doc.setFontSize(12)
  doc.text('Top Recommendations', margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  for (const [index, recommendation] of recommendations.slice(0, 3).entries()) {
    const wrappedText = doc.splitTextToSize(`${index + 1}. ${recommendation.action}`, contentWidth - 10)

    for (const line of wrappedText as string[]) {
      yPosition = ensurePageSpace(doc, yPosition, pageHeight, margin)
      doc.text(line, margin + 5, yPosition)
      yPosition += 5
    }

    yPosition += 2
  }

  return yPosition
}

/**
 * Generate a PDF report for the current footprint and recommendations.
 */
export function generatePdfReport(
  breakdown: CarbonFootprintBreakdown,
  recommendations: Recommendation[],
): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  let yPosition = margin
  yPosition = writeHeader(doc, margin, yPosition)
  yPosition = writeSummary(doc, breakdown, margin, yPosition)
  yPosition = writeCategoryBreakdown(doc, breakdown, margin, yPosition)
  yPosition = writeRecommendations(doc, recommendations, margin, yPosition, pageHeight, contentWidth)

  void yPosition
  doc.save('carbon-footprint-report.pdf')
}
