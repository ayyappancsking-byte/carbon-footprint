import '@testing-library/jest-dom'

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (() =>
      ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      })) as typeof window.matchMedia
  }

  if (!window.ResizeObserver) {
    class ResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    ;(window as typeof window & { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      ResizeObserver
  }

  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: () => undefined,
  })

  const originalGetComputedStyle = window.getComputedStyle.bind(window)
  window.getComputedStyle = ((element: Element) => originalGetComputedStyle(element)) as typeof window.getComputedStyle

  if (typeof HTMLCanvasElement !== 'undefined') {
    const canvasContext = () =>
      new Proxy(
        {
          canvas: document.createElement('canvas'),
          measureText: (text: string) => ({ width: String(text).length * 8 }),
          getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
        },
        {
          get(target, property) {
            if (property in target) {
              return target[property as keyof typeof target]
            }

            return () => undefined
          },
        },
      ) as unknown as CanvasRenderingContext2D

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => canvasContext(),
    })
  }
}
