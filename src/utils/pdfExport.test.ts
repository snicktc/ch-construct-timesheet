import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetDefaultLogoPathForRecipient = vi.fn((recipient: string) => {
  if (recipient === 'CH Construct') {
    return 'logos/logo_CH-Construct.jpg'
  }

  if (recipient === 'VBW') {
    return 'logos/logo_VBW.png'
  }

  return ''
})

const pdfMockState = vi.hoisted(() => {
  const autoTableMock = vi.fn()
  const jsPdfInstances: Array<{
    lastAutoTable?: { finalY?: number }
    addImage: ReturnType<typeof vi.fn>
    setFont: ReturnType<typeof vi.fn>
    setFontSize: ReturnType<typeof vi.fn>
    text: ReturnType<typeof vi.fn>
    setDrawColor: ReturnType<typeof vi.fn>
    line: ReturnType<typeof vi.fn>
    rect: ReturnType<typeof vi.fn>
    setFillColor: ReturnType<typeof vi.fn>
    setTextColor: ReturnType<typeof vi.fn>
    setPage: ReturnType<typeof vi.fn>
    getNumberOfPages: ReturnType<typeof vi.fn>
    output: ReturnType<typeof vi.fn>
  }> = []

  class MockJsPdf {
    lastAutoTable?: { finalY?: number }
    addImage = vi.fn()
    setFont = vi.fn()
    setFontSize = vi.fn()
    text = vi.fn()
    setDrawColor = vi.fn()
    line = vi.fn()
    rect = vi.fn()
    setFillColor = vi.fn()
    setTextColor = vi.fn()
    setPage = vi.fn()
    getNumberOfPages = vi.fn().mockReturnValue(2)
    output = vi.fn().mockReturnValue(new Blob(['pdf'], { type: 'application/pdf' }))

    constructor() {
      jsPdfInstances.push(this)
    }
  }

  return { autoTableMock, jsPdfInstances, MockJsPdf }
})

vi.mock('jspdf', () => ({
  jsPDF: pdfMockState.MockJsPdf,
}))

vi.mock('jspdf-autotable', () => ({
  default: (...args: unknown[]) => {
    pdfMockState.autoTableMock(...args)
    const doc = args[0] as { lastAutoTable?: { finalY?: number } }
    const config = args[1] as { startY?: number }
    doc.lastAutoTable = { finalY: (config.startY ?? 40) + 20 }
  },
}))

vi.mock('./logoUtils', () => ({
  getDefaultLogoPathForRecipient: (recipient: string) => mockGetDefaultLogoPathForRecipient(recipient),
}))

import { generateTimesheetPdf } from './pdfExport'

describe('generateTimesheetPdf', () => {
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    pdfMockState.jsPdfInstances.length = 0
    pdfMockState.autoTableMock.mockReset()
    mockGetDefaultLogoPathForRecipient.mockClear()

    class MockImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      naturalWidth = 200
      naturalHeight = 100
      width = 200
      height = 100
      crossOrigin: string | null = null

      set src(_: string) {
        this.onload?.()
      }
    }

    vi.stubGlobal('Image', MockImage)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toDataURL: () => 'data:image/png;base64,generated-logo',
        } as unknown as HTMLCanvasElement
      }

      return originalCreateElement(tagName)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns a sanitized filename and fortnight metadata', async () => {
    const result = await generateTimesheetPdf({
      employee: {
        id: 1,
        name: 'Milan Test',
        exportRecipient: 'CH Construct',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
      fortnightStart: new Date('2026-04-13T00:00:00.000Z'),
      entries: [
        {
          id: 1,
          employeeId: 1,
          date: '2026-04-14',
          sortOrder: 0,
          clientId: 1,
          clientName: 'CH Construct',
          location: 'Gent',
          startTime: '06:30',
          endTime: '15:30',
          breakMinutes: 45,
          travelCreditMinutes: 0,
          isDriver: 'Ja',
          notes: 'Werf',
        },
      ],
    })

    expect(result.fileName).toBe('Werkuren_Milan_Test_Week_16-17.pdf')
    expect(result.weekStart).toBe('2026-04-13')
    expect(result.weekEnd).toBe('2026-04-26')
    expect(pdfMockState.autoTableMock).toHaveBeenCalledTimes(3)
    expect(pdfMockState.jsPdfInstances[0]?.addImage).toHaveBeenCalled()
    expect(pdfMockState.jsPdfInstances[0]?.text).toHaveBeenCalledWith('WERKURENREGISTRATIE', expect.any(Number), 18)
    expect(mockGetDefaultLogoPathForRecipient).toHaveBeenCalledWith('CH Construct')
  })

  it('generates a normal fortnight PDF within a basic performance budget', async () => {
    const entries = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      employeeId: 1,
      date: `2026-04-${String(14 + index).padStart(2, '0')}`,
      sortOrder: 0,
      clientId: (index % 2) + 1,
      clientName: index % 2 === 0 ? 'CH Construct' : 'VBW',
      location: index % 2 === 0 ? 'Gent' : 'Brugge',
      startTime: '06:30',
      endTime: '15:30',
      breakMinutes: 45,
      travelCreditMinutes: 0,
      isDriver: 'Ja' as const,
      notes: index % 3 === 0 ? 'Werfcontrole' : '',
    }))

    const startTime = performance.now()
    const result = await generateTimesheetPdf({
      employee: {
        id: 1,
        name: 'Milan Test',
        exportRecipient: 'VBW',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
      fortnightStart: new Date('2026-04-13T00:00:00.000Z'),
      entries,
    })
    const duration = performance.now() - startTime

    expect(duration).toBeLessThan(1500)
    expect(result.fileName).toBe('Werkuren_Milan_Test_Week_16-17.pdf')
    expect(result.pdfBlob).toBeInstanceOf(Blob)
    expect(result.pdfFile.name).toBe('Werkuren_Milan_Test_Week_16-17.pdf')
    expect(mockGetDefaultLogoPathForRecipient).toHaveBeenCalledWith('VBW')
  })

  it('uses compact table settings that keep the summary together and subtotal readable', async () => {
    await generateTimesheetPdf({
      employee: {
        id: 1,
        name: 'Milan Test',
        exportRecipient: 'CH Construct',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
      fortnightStart: new Date('2026-04-20T00:00:00.000Z'),
      entries: [
        {
          id: 1,
          employeeId: 1,
          date: '2026-04-22',
          sortOrder: 0,
          clientId: 1,
          clientName: 'matys',
          location: 'Damme',
          startTime: '06:30',
          endTime: '14:00',
          breakMinutes: 30,
          travelCreditMinutes: 0,
          isDriver: 'Ja',
          notes: '',
        },
        {
          id: 2,
          employeeId: 1,
          date: '2026-04-22',
          sortOrder: 1,
          clientId: 2,
          clientName: 'PM nation',
          location: 'Assenede',
          startTime: '14:00',
          endTime: '17:00',
          breakMinutes: 0,
          travelCreditMinutes: 0,
          isDriver: 'Ja',
          notes: '',
        },
      ],
    })

    const weekTableConfig = pdfMockState.autoTableMock.mock.calls[0]?.[1] as {
      startY: number
      head: string[][]
      columnStyles: Record<number, { cellWidth: number }>
      headStyles: { fillColor: number[] }
      didParseCell: (hookData: {
        section: string
        row: { raw: string[]; index: number }
        column: { index: number }
        cell: { styles: { fillColor?: number[]; textColor?: number[] } }
      }) => void
      footStyles: { fillColor: number[] }
      foot: string[][]
      styles: { fontSize: number; minCellHeight: number }
    }
    const summaryTableConfig = pdfMockState.autoTableMock.mock.calls[2]?.[1] as {
      startY: number
      pageBreak: string
      columnStyles: Record<number, { cellWidth: number }>
      styles: { fontSize: number; minCellHeight: number }
    }

    expect(weekTableConfig.startY).toBe(46)
    expect(weekTableConfig.head).toEqual([[
      'Week\n17',
      'Klant',
      'Locatie',
      'Start',
      'Einde',
      'Pauze',
      'Chauf.',
      'Totaal/\nklant',
      'Totaal/\ndag',
    ]])
    expect(weekTableConfig.columnStyles[0]?.cellWidth).toBe(16)
    expect(weekTableConfig.columnStyles[1]?.cellWidth).toBe(42)
    expect(weekTableConfig.columnStyles[2]?.cellWidth).toBe(38)
    expect(weekTableConfig.columnStyles[6]?.cellWidth).toBe(14)
    expect(weekTableConfig.columnStyles[7]?.cellWidth).toBe(18)
    expect(weekTableConfig.columnStyles[8]?.cellWidth).toBe(17)
    expect(weekTableConfig.foot).toEqual([['', '', '', '', '', '', '', 'Subtotaal', '10:00']])
    expect(weekTableConfig.headStyles.fillColor).toEqual([232, 232, 232])
    expect(weekTableConfig.styles.fontSize).toBe(8.4)
    expect(weekTableConfig.styles.minCellHeight).toBe(7)

    const regularRowCell = { styles: {} as { fillColor?: number[]; textColor?: number[] } }
    weekTableConfig.didParseCell({
      section: 'body',
      row: { raw: ['di 21', '—', '', '', '', '', '', '', ''], index: 1 },
      column: { index: 0 },
      cell: regularRowCell,
    })
    expect(regularRowCell.styles.fillColor).toEqual([235, 242, 250])

    expect(weekTableConfig.footStyles.fillColor).toEqual([232, 232, 232])

    expect(summaryTableConfig.pageBreak).toBe('avoid')
    expect(summaryTableConfig.startY).toBe(100)
    expect(summaryTableConfig.columnStyles[0]?.cellWidth).toBe(124)
    expect(summaryTableConfig.columnStyles[1]?.cellWidth).toBe(28)
    expect(summaryTableConfig.styles.fontSize).toBe(8.8)
    expect(summaryTableConfig.styles.minCellHeight).toBe(7)
  })
})
