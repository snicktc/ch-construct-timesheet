import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import type { Employee, TimeEntry } from '../db/database'
import { getDefaultLogoPathForRecipient } from './logoUtils'
import { calculateDayTotalMinutes, calculateEntryMinutes, formatMinutesAsHours } from './timeCalc'
import {
  formatDateKey,
  formatLongDate,
  formatShortDate,
  getFortnightDates,
  getIsoWeekNumber,
  isWeekend,
} from './weekHelpers'

type ExportClientSummary = {
  clientName: string
  totalMinutes: number
  uniqueDates: Set<string>
}

type GenerateTimesheetPdfInput = {
  employee: Employee
  fortnightStart: Date
  entries: TimeEntry[]
}

const detectImageFormat = (dataUrl: string) => {
  if (dataUrl.startsWith('data:image/png')) {
    return 'PNG'
  }

  if (dataUrl.startsWith('data:image/webp')) {
    return 'WEBP'
  }

  return 'JPEG'
}

type LogoResult = { dataUrl: string; width: number; height: number }

const loadLogoViaCanvas = (src: string): Promise<LogoResult> =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const naturalWidth = img.naturalWidth || img.width
        const naturalHeight = img.naturalHeight || img.height
        canvas.width = naturalWidth
        canvas.height = naturalHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve({ dataUrl: '', width: 0, height: 0 })
          return
        }

        ctx.drawImage(img, 0, 0)
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: naturalWidth, height: naturalHeight })
      } catch {
        resolve({ dataUrl: '', width: 0, height: 0 })
      }
    }
    img.onerror = () => resolve({ dataUrl: '', width: 0, height: 0 })
    img.src = src
  })

const sanitizeFilePart = (value: string) => value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '')

const sortEntries = (entries: TimeEntry[]) => [...entries].sort((left, right) => left.sortOrder - right.sortOrder)

const groupEntriesByDate = (entries: TimeEntry[]) => {
  const grouped = new Map<string, TimeEntry[]>()

  for (const entry of entries) {
    const current = grouped.get(entry.date) ?? []
    current.push(entry)
    grouped.set(entry.date, current)
  }

  for (const [date, dateEntries] of grouped) {
    grouped.set(date, sortEntries(dateEntries))
  }

  return grouped
}

const buildClientSummary = (entries: TimeEntry[]) => {
  const summary = new Map<string, ExportClientSummary>()

  for (const entry of entries) {
    const current =
      summary.get(entry.clientName) ??
      ({ clientName: entry.clientName, totalMinutes: 0, uniqueDates: new Set<string>() } satisfies ExportClientSummary)

    current.totalMinutes += calculateEntryMinutes(entry)
    current.uniqueDates.add(entry.date)
    summary.set(entry.clientName, current)
  }

  return [...summary.values()].sort((left, right) => right.totalMinutes - left.totalMinutes)
}

const addHeader = async (
  doc: jsPDF,
  employee: Employee,
  weekOneNumber: number,
  weekTwoNumber: number,
  periodStart: Date,
  periodEnd: Date,
) => {
  let logoDataUrl = ''
  let logoNaturalWidth = 0
  let logoNaturalHeight = 0

  if (!logoDataUrl) {
    const baseUrl = import.meta.env.BASE_URL
    const logoPath = getDefaultLogoPathForRecipient(employee.exportRecipient)

    if (logoPath) {
      const result = await loadLogoViaCanvas(`${baseUrl}${logoPath}`)
      logoDataUrl = result.dataUrl
      logoNaturalWidth = result.width
      logoNaturalHeight = result.height
    }
  }

  const hasLogo = Boolean(logoDataUrl)
  let logoDrawWidth = 0

  if (hasLogo) {
    try {
      const MAX_LOGO_W = 40
      const MAX_LOGO_H = 22

      let drawW = MAX_LOGO_W
      let drawH = MAX_LOGO_H

      if (logoNaturalWidth > 0 && logoNaturalHeight > 0) {
        const scale = Math.min(MAX_LOGO_W / logoNaturalWidth, MAX_LOGO_H / logoNaturalHeight)
        drawW = logoNaturalWidth * scale
        drawH = logoNaturalHeight * scale
      }

      logoDrawWidth = drawW
      doc.addImage(logoDataUrl, detectImageFormat(logoDataUrl), 14, 10, drawW, drawH)
    } catch (error) {
      console.error('Failed to add export logo to PDF', error)
    }
  }

  const textX = hasLogo ? 14 + logoDrawWidth + 4 : 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('WERKURENREGISTRATIE', textX, 18)

  doc.setFontSize(12)
  doc.text(`Naam: ${employee.name}`, textX, 25)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Week ${weekOneNumber}-${weekTwoNumber}`, textX, 31)
  doc.text(`${formatLongDate(periodStart)} – ${formatLongDate(periodEnd)}`, textX, 37)

  doc.setDrawColor(210, 214, 221)
  doc.line(14, 42, 196, 42)
}

const addWeekTable = (
  doc: jsPDF,
  weekTitle: string,
  weekDates: Date[],
  entriesByDate: Map<string, TimeEntry[]>,
  startY: number,
) => {
  const body: Array<Array<string>> = []
  const rowDayIndices: number[] = []
  const rowDaySizes: number[] = []
  const rowIsWeekend: boolean[] = []
  let dayIndex = 0

  for (const date of weekDates) {
    const dateKey = formatDateKey(date)
    const dateEntries = entriesByDate.get(dateKey) ?? []
    const isWeekendDay = isWeekend(date)

    if (dateEntries.length === 0) {
      body.push([
        formatShortDate(date),
        isWeekendDay ? 'Weekend' : '—',
        '', '', '', '', '', '', '',
      ])
      rowDayIndices.push(dayIndex)
      rowDaySizes.push(1)
      rowIsWeekend.push(isWeekendDay)
      dayIndex++
      continue
    }

    const dayTotal = calculateDayTotalMinutes(dateEntries)

    const clientGroups = new Map<string, TimeEntry[]>()
    for (const entry of dateEntries) {
      const group = clientGroups.get(entry.clientName) ?? []
      group.push(entry)
      clientGroups.set(entry.clientName, group)
    }

    const clientTotals = new Map<string, number>()
    for (const [clientName, clientEntries] of clientGroups) {
      clientTotals.set(clientName, calculateDayTotalMinutes(clientEntries))
    }

    const clientLastRowIndex = new Map<string, number>()
    dateEntries.forEach((entry, index) => {
      clientLastRowIndex.set(entry.clientName, index)
    })

    let rowsForDay = 0
    dateEntries.forEach((entry) => {
      rowsForDay++
      if (entry.notes) rowsForDay++
    })

    dateEntries.forEach((entry, index) => {
      const isFirstOfDay = index === 0
      const isLastOfClient = clientLastRowIndex.get(entry.clientName) === index
      const clientTotal = clientTotals.get(entry.clientName) ?? 0

      body.push([
        isFirstOfDay ? formatShortDate(date) : '',
        entry.clientName,
        entry.location,
        entry.startTime,
        entry.endTime,
        entry.breakMinutes > 0 ? formatMinutesAsHours(entry.breakMinutes) : '',
        entry.isDriver,
        isLastOfClient ? formatMinutesAsHours(clientTotal) : '',
        isFirstOfDay ? formatMinutesAsHours(dayTotal) : '',
      ])
      rowDayIndices.push(dayIndex)
      rowDaySizes.push(rowsForDay)
      rowIsWeekend.push(isWeekendDay)

      if (entry.notes) {
        body.push(['', `opm: ${entry.notes}`, '', '', '', '', '', '', ''])
        rowDayIndices.push(dayIndex)
        rowDaySizes.push(rowsForDay)
        rowIsWeekend.push(isWeekendDay)
      }
    })

    dayIndex++
  }

  const weekMinutes = weekDates.reduce((total, date) => {
    const dateEntries = entriesByDate.get(formatDateKey(date)) ?? []
    return total + calculateDayTotalMinutes(dateEntries)
  }, 0)

  type DayMergeEntry = {
    value: string
    cellX: number
    cellW: number
    cellH: number
    startY: number
    endY: number
    isWeekend: boolean
  }

  const dayMergeMap = new Map<number, DayMergeEntry>()

  autoTable(doc, {
    startY,
    head: [[`Week\n${weekTitle.replace('Week ', '')}`, 'Klant', 'Locatie', 'Start', 'Einde', 'Pauze', 'Chauf.', 'Totaal/\nklant', 'Totaal/\ndag']],
    body: body.map((row) => [...row.slice(0, 8), '']),
    foot: [['', '', '', '', '', '', '', 'Subtotaal', formatMinutesAsHours(weekMinutes)]],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.4,
      cellPadding: { top: 1.7, right: 1.8, bottom: 1.7, left: 1.8 },
      minCellHeight: 7,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [245, 245, 246],
      textColor: [26, 26, 26],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    footStyles: {
      fillColor: [245, 245, 246],
      textColor: [26, 26, 26],
      fontStyle: 'bold',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 42 },
      2: { cellWidth: 38 },
      3: { cellWidth: 13 },
      4: { cellWidth: 13 },
      5: { cellWidth: 13 },
      6: { cellWidth: 12 },
      7: { cellWidth: 18, halign: 'right', fontStyle: 'bold', overflow: 'visible' },
      8: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        const row = hookData.row.raw as string[] | undefined
        const rowIdx = hookData.row.index
        const dayIdx = rowDayIndices[rowIdx] ?? 0
        const isWeekendRow = rowIsWeekend[rowIdx] ?? false

        if (isWeekendRow) {
          hookData.cell.styles.fillColor = [242, 242, 242]
        } else if (dayIdx % 2 === 0) {
          hookData.cell.styles.fillColor = [255, 255, 255]
        } else {
          hookData.cell.styles.fillColor = [235, 242, 250]
        }

        if (row?.[1]?.startsWith('opm:')) {
          hookData.cell.styles.fontStyle = 'italic'
          hookData.cell.styles.textColor = [107, 114, 128]
        }

        if (hookData.column.index === 8) {
          hookData.cell.styles.halign = 'right'
          hookData.cell.styles.valign = 'middle'
        }
      }

      if (hookData.section === 'foot' && hookData.column.index === 7) {
        hookData.cell.styles.overflow = 'visible'
      }

      if (hookData.section === 'foot' && (hookData.column.index === 7 || hookData.column.index === 8)) {
        hookData.cell.styles.halign = hookData.column.index === 8 ? 'right' : 'left'
        hookData.cell.styles.valign = 'middle'
      }
    },
    didDrawCell: (hookData) => {
      if (hookData.section !== 'body' || hookData.column.index !== 8) {
        return
      }

      const rowIdx = hookData.row.index
      const dayIdx = rowDayIndices[rowIdx] ?? 0
      const originalValue = body[rowIdx]?.[8] ?? ''
      const cellX = hookData.cell.x
      const cellW = hookData.cell.width
      const cellY = hookData.cell.y
      const cellH = hookData.cell.height

      const isWeekendRow = rowIsWeekend[rowIdx] ?? false
      const existing = dayMergeMap.get(dayIdx)

      if (!existing) {
        dayMergeMap.set(dayIdx, {
          value: originalValue,
          cellX,
          cellW,
          cellH,
          startY: cellY,
          endY: cellY + cellH,
          isWeekend: isWeekendRow,
        })
      } else {
        existing.endY = cellY + cellH
        if (!existing.value && originalValue) {
          existing.value = originalValue
        }
      }
    },
  })

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? startY

  for (const [dayIdx, entry] of dayMergeMap) {
    const hasMultipleRows = entry.endY - entry.startY > entry.cellH * 1.5

    if (!hasMultipleRows && !entry.value) {
      continue
    }

    const fillColor: [number, number, number] = entry.isWeekend
      ? [242, 242, 242]
      : dayIdx % 2 === 0
        ? [255, 255, 255]
        : [235, 242, 250]

    if (hasMultipleRows) {
      doc.setFillColor(...fillColor)
      doc.rect(entry.cellX, entry.startY, entry.cellW, entry.endY - entry.startY, 'F')
    }

    if (!entry.value) {
      continue
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(26, 26, 26)

    const midY = entry.startY + (entry.endY - entry.startY) / 2 + 1.1
    doc.text(entry.value, entry.cellX + entry.cellW - 1.8, midY, { align: 'right' })
  }

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  return finalY
}

export async function generateTimesheetPdf({
  employee,
  fortnightStart,
  entries,
}: GenerateTimesheetPdfInput) {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' })
  const fortnightDates = getFortnightDates(fortnightStart)
  const periodStart = fortnightDates[0]
  const periodEnd = fortnightDates[13]
  const weekOneNumber = getIsoWeekNumber(fortnightDates[0])
  const weekTwoNumber = getIsoWeekNumber(fortnightDates[7])
  const entriesByDate = groupEntriesByDate(entries)
  const summary = buildClientSummary(entries)
  const totalMinutes = entries.reduce((total, entry) => total + calculateEntryMinutes(entry), 0)
  const totalDays = new Set(entries.map((entry) => entry.date)).size

  await addHeader(doc, employee, weekOneNumber, weekTwoNumber, periodStart, periodEnd)

  let currentY = addWeekTable(doc, `Week ${weekOneNumber}`, fortnightDates.slice(0, 7), entriesByDate, 46)
  currentY = addWeekTable(doc, `Week ${weekTwoNumber}`, fortnightDates.slice(7, 14), entriesByDate, currentY + 7)

  autoTable(doc, {
    startY: currentY + 7,
    head: [['Klant', 'Dagen', 'Uren']],
    body: summary.map((client) => [
      client.clientName,
      String(client.uniqueDates.size),
      formatMinutesAsHours(client.totalMinutes),
    ]),
    foot: [['TOTAAL 2 WEKEN', String(totalDays), formatMinutesAsHours(totalMinutes)]],
    theme: 'grid',
    pageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 8.8,
      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
      minCellHeight: 7,
      valign: 'middle',
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [245, 245, 246],
      textColor: [26, 26, 26],
      fontStyle: 'bold',
      valign: 'middle',
    },
    footStyles: {
      fillColor: [245, 245, 246],
      textColor: [26, 26, 26],
      fontStyle: 'bold',
      valign: 'middle',
    },
    margin: { left: 14 },
    columnStyles: {
      0: { cellWidth: 124 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
    },
  })

  const pageCount = doc.getNumberOfPages()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`pagina ${page}/${pageCount}`, 196, 294, { align: 'right' })
  }

  const fileName = `Werkuren_${sanitizeFilePart(employee.name)}_Week_${weekOneNumber}-${weekTwoNumber}.pdf`
  const pdfBlob = doc.output('blob')
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

  return {
    doc,
    fileName,
    pdfBlob,
    pdfFile,
    weekStart: formatDateKey(periodStart),
    weekEnd: formatDateKey(periodEnd),
    weekOneNumber,
    weekTwoNumber,
  }
}
