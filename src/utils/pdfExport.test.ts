import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { generateTimesheetPdf } from './pdfExport'

describe('generateTimesheetPdf', () => {
  beforeEach(() => {
    pdfMockState.jsPdfInstances.length = 0
    pdfMockState.autoTableMock.mockReset()
  })

  it('returns a sanitized filename and fortnight metadata', async () => {
    const result = await generateTimesheetPdf({
      employee: {
        id: 1,
        name: 'Milan Test',
        exportRecipient: 'CH Construct',
        exportLogo: 'data:image/png;base64,logo',
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
        exportRecipient: 'CH Construct',
        exportLogo: 'data:image/png;base64,logo',
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
  })
})
