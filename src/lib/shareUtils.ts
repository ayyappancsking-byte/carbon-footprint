/**
 * Build the text used by both Web Share and clipboard fallback flows.
 */
function buildShareText(total: number): string {
  return `My carbon footprint is ${total.toFixed(2)} tCO2e/year - calculate yours and start reducing it!`
}

/**
 * Try to use the native Web Share API.
 */
async function tryNativeShare(shareText: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false
  }

  try {
    await navigator.share({
      text: shareText,
      title: 'Carbon Footprint Report',
    })
    return true
  } catch {
    return false
  }
}

/**
 * Try to copy the share text to the clipboard.
 */
async function tryClipboardShare(shareText: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false
  }

  try {
    await navigator.clipboard.writeText(shareText)
    return true
  } catch {
    return false
  }
}

/**
 * Share the carbon footprint result using the best available browser surface.
 */
export async function shareResult(total: number): Promise<boolean> {
  const shareText = buildShareText(total)
  const shared = await tryNativeShare(shareText)
  if (shared) {
    return true
  }

  return tryClipboardShare(shareText)
}
