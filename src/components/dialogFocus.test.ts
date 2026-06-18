import { afterEach, describe, expect, it, vi } from 'vitest'
import { trapDialogFocus } from './dialogFocus'

describe('trapDialogFocus', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('ignores non-Tab key presses when the dialog has no focusable elements', () => {
    const dialog = document.createElement('div')
    document.body.append(dialog)

    const onEscape = vi.fn()
    const restoreFocus = trapDialogFocus(dialog, onEscape)

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(onEscape).not.toHaveBeenCalled()

    restoreFocus()
  })
})
