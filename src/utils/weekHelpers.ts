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

export const getFortnightStart = (value: Date) => getStartOfWeek(value)

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
