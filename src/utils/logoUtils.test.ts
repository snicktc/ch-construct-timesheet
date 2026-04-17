import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDefaultLogoForRecipient, resizeImageToDataUrl } from './logoUtils'

class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: null | (() => void) = null
  onerror: null | (() => void) = null

  readAsDataURL(input: Blob | File) {
    if ((input as File).name === 'broken-file') {
      this.onerror?.()
      return
    }

    this.result = input instanceof File ? 'data:image/png;base64,source' : 'data:image/png;base64,default'
    this.onload?.()
  }
}

class MockImage {
  width = 800
  height = 400
  onload: null | (() => void) = null
  onerror: null | (() => void) = null

  set src(value: string) {
    if (value.includes('broken')) {
      this.onerror?.()
      return
    }

    this.onload?.()
  }
}

describe('logoUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('FileReader', MockFileReader)
    vi.stubGlobal('Image', MockImage)
  })

  it('resizes images to a PNG data url', async () => {
    const drawImage = vi.fn()
    const toDataURL = vi.fn().mockReturnValue('data:image/png;base64,resized')
    const originalCreateElement = document.createElement.bind(document)
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage }),
      toDataURL,
    }
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return canvas as unknown as HTMLCanvasElement
      }

      return originalCreateElement(tagName)
    })

    const file = new File(['x'], 'logo.png', { type: 'image/png' })
    const result = await resizeImageToDataUrl(file)

    expect(result).toBe('data:image/png;base64,resized')
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(200)
    expect(drawImage).toHaveBeenCalled()
  })

  it('returns an empty string for unknown recipients', async () => {
    await expect(getDefaultLogoForRecipient('Unknown')).resolves.toBe('')
  })

  it('loads and converts a known default logo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
      }),
    )

    const result = await getDefaultLogoForRecipient('VBW')

    expect(fetch).toHaveBeenCalled()
    expect(result).toBe('data:image/png;base64,default')
  })
})
