const MAX_LOGO_WIDTH = 400

const DEFAULT_LOGO_BY_RECIPIENT: Record<string, string> = {
  'ch construct': '/logos/logo_CH-Construct.jpg',
  vbw: '/logos/logo_VBW.png',
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Logo lezen mislukt.'))
    }

    reader.onerror = () => reject(new Error('Logo lezen mislukt.'))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Afbeelding laden mislukt.'))
    image.src = src
  })

export async function resizeImageToDataUrl(file: File, maxWidth = MAX_LOGO_WIDTH) {
  const sourceDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(sourceDataUrl)
  const scale = Math.min(1, maxWidth / image.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas initialiseren mislukt.')
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png', 0.92)
}

export async function getDefaultLogoForRecipient(exportRecipient: string) {
  const normalizedRecipient = exportRecipient.trim().toLowerCase()
  const logoPath = DEFAULT_LOGO_BY_RECIPIENT[normalizedRecipient]

  if (!logoPath) {
    return ''
  }

  const response = await fetch(logoPath)

  if (!response.ok) {
    throw new Error('Standaardlogo laden mislukt.')
  }

  const blob = await response.blob()

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Standaardlogo omzetten mislukt.'))
    }

    reader.onerror = () => reject(new Error('Standaardlogo omzetten mislukt.'))
    reader.readAsDataURL(blob)
  })
}
