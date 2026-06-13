export async function shareResult(total: number): Promise<boolean> {
  const shareText = `My carbon footprint is ${total.toFixed(2)} tCO2e/year — calculate yours and start reducing it!`

  if (navigator.share) {
    try {
      await navigator.share({
        text: shareText,
        title: 'Carbon Footprint Report',
      })
      return true
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error)
      }
      return false
    }
  }

  try {
    await navigator.clipboard.writeText(shareText)
    return true
  } catch {
    console.error('Clipboard copy failed')
    return false
  }
}
