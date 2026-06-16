export async function shareResult(total: number): Promise<boolean> {
  const shareText = `My carbon footprint is ${total.toFixed(2)} tCO2e/year - calculate yours and start reducing it!`
  const nav = typeof navigator === 'undefined' ? null : navigator

  if (nav?.share) {
    try {
      await nav.share({
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
    const clipboard = nav?.clipboard
    if (!clipboard?.writeText) {
      return false
    }
    await clipboard.writeText(shareText)
    return true
  } catch {
    console.error('Clipboard copy failed')
    return false
  }
}
