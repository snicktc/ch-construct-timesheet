const DAY_LABELS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const SHORT_DAY_LABELS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const MONTH_LABELS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
] as const

const toDateOnly = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate())

export const formatDateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const parseDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export const addDays = (value: Date, amount: number) => {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return toDateOnly(next)
}

export const getStartOfWeek = (value: Date) => {
  const normalized = toDateOnly(value)
  const day = normalized.getDay()
  const offset = day === 0 ? -6 : 1 - day
  return addDays(normalized, offset)
}

export const getWeekdayDates = (value: Date) => {
  const startOfWeek = getStartOfWeek(value)
  return Array.from({ length: 5 }, (_, index) => addDays(startOfWeek, index))
}

export const getWeekStartKey = (value: Date) => formatDateKey(getStartOfWeek(value))

const MS_PER_DAY = 86400000

// Monday of ISO week 1 of 2026. Fortnights are counted in fixed 14-day blocks
// from this epoch, so every date belongs to exactly one, non-overlapping
// period. Because the epoch is an odd ISO week, periods start on odd ISO
// weeks (15-16, 17-18, ...). Note: after a 53-week ISO year the parity flips
// for the following year; the block boundaries themselves stay stable.
const FORTNIGHT_EPOCH = new Date(2025, 11, 29)

export const getFortnightStart = (value: Date) => {
  const weekStart = getStartOfWeek(value)
  // Math.round absorbs the one-hour offset introduced by DST transitions.
  const daysSinceEpoch = Math.round((weekStart.getTime() - FORTNIGHT_EPOCH.getTime()) / MS_PER_DAY)
  const weeksSinceEpoch = Math.floor(daysSinceEpoch / 7)
  const isSecondWeekOfFortnight = ((weeksSinceEpoch % 2) + 2) % 2 === 1

  return isSecondWeekOfFortnight ? addDays(weekStart, -7) : weekStart
}

export const isSecondWeekOfFortnight = (value: Date) =>
  formatDateKey(getStartOfWeek(value)) !== formatDateKey(getFortnightStart(value))

export const getFortnightDates = (value: Date) => {
  const start = getFortnightStart(value)
  return Array.from({ length: 14 }, (_, index) => addDays(start, index))
}

export const isSameDate = (left: Date, right: Date) => formatDateKey(left) === formatDateKey(right)

export const isWeekend = (value: Date) => {
  const day = value.getDay()
  return day === 0 || day === 6
}

export const formatLongDate = (value: Date) =>
  `${value.getDate()} ${MONTH_LABELS[value.getMonth()]} ${value.getFullYear()}`

export const formatShortDate = (value: Date) =>
  `${getShortDayLabel(value)} ${String(value.getDate()).padStart(2, '0')}`

export const getDayLabel = (value: Date) => DAY_LABELS[value.getDay()]

export const getShortDayLabel = (value: Date) => SHORT_DAY_LABELS[value.getDay()]

export const getIsoWeekNumber = (value: Date) => {
  const date = toDateOnly(value)
  const dayNumber = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - dayNumber + 3)
  const firstThursday = new Date(date.getFullYear(), 0, 4)
  const firstDayNumber = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3)

  const diff = date.getTime() - firstThursday.getTime()
  return 1 + Math.round(diff / 604800000)
}
