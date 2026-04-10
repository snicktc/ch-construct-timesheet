import { db } from '../db/database'
import {
  LAST_DAILY_NOTIFICATION_KEY,
  LAST_EXPORT_NOTIFICATION_KEY,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
} from './storageKeys'
import { formatDateKey, getFortnightDates, getStartOfWeek } from './weekHelpers'

export type NotificationSettings = {
  dailyReminderEnabled: boolean
  dailyReminderTime: string
  fridayExportPromptEnabled: boolean
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: '17:00',
  fridayExportPromptEnabled: true,
}

const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

const getNowMinutes = (value: Date) => value.getHours() * 60 + value.getMinutes()

export const getNotificationSupport = () => ({
  notifications: typeof window !== 'undefined' && 'Notification' in window,
  serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  share: typeof navigator !== 'undefined' && 'share' in navigator,
})

export const getNotificationSettings = (): NotificationSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  const rawValue = window.localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY)

  if (!rawValue) {
    return DEFAULT_SETTINGS
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<NotificationSettings>

    return {
      dailyReminderEnabled: parsedValue.dailyReminderEnabled ?? DEFAULT_SETTINGS.dailyReminderEnabled,
      dailyReminderTime: parsedValue.dailyReminderTime ?? DEFAULT_SETTINGS.dailyReminderTime,
      fridayExportPromptEnabled:
        parsedValue.fridayExportPromptEnabled ?? DEFAULT_SETTINGS.fridayExportPromptEnabled,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveNotificationSettings = (settings: NotificationSettings) => {
  window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export const requestNotificationPermission = async () => {
  if (!getNotificationSupport().notifications) {
    return 'unsupported' as const
  }

  if (Notification.permission === 'granted') {
    return 'granted' as const
  }

  const permission = await Notification.requestPermission()
  return permission
}

export const showAppNotification = async (title: string, options: NotificationOptions = {}) => {
  const support = getNotificationSupport()

  if (!support.notifications || !support.serviceWorker || Notification.permission !== 'granted') {
    throw new Error('Notificaties zijn niet beschikbaar of niet toegestaan.')
  }

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(title, {
    badge: '/icon-192.png',
    icon: '/icon-192.png',
    data: { url: '/?tab=today' },
    ...options,
  })
}

const shouldSendDailyReminder = (settings: NotificationSettings, now: Date) => {
  if (!settings.dailyReminderEnabled) {
    return false
  }

  const todayKey = formatDateKey(now)
  const lastSentDate = window.localStorage.getItem(LAST_DAILY_NOTIFICATION_KEY)

  if (lastSentDate === todayKey) {
    return false
  }

  return getNowMinutes(now) >= parseTimeToMinutes(settings.dailyReminderTime)
}

const hasCompleteFortnight = async (employeeId: number, anchorDate: Date) => {
  const fortnightDates = getFortnightDates(getStartOfWeek(anchorDate))
  const weekdayKeys = fortnightDates.filter((date) => {
    const day = date.getDay()
    return day >= 1 && day <= 5
  }).map(formatDateKey)

  const entries = await db.timeEntries
    .where('[employeeId+date]')
    .between([employeeId, weekdayKeys[0]], [employeeId, weekdayKeys[weekdayKeys.length - 1]], true, true)
    .toArray()

  const completedDates = new Set(entries.map((entry) => entry.date))
  return weekdayKeys.every((dateKey) => completedDates.has(dateKey))
}

const shouldSendFridayExportPrompt = async (
  settings: NotificationSettings,
  now: Date,
  activeEmployeeId: number | null,
) => {
  if (!settings.fridayExportPromptEnabled || !activeEmployeeId) {
    return false
  }

  if (now.getDay() !== 5 || getNowMinutes(now) < parseTimeToMinutes('18:00')) {
    return false
  }

  const fortnightDates = getFortnightDates(getStartOfWeek(now))
  const periodKey = `${formatDateKey(fortnightDates[0])}_${formatDateKey(fortnightDates[13])}`
  const lastPromptPeriod = window.localStorage.getItem(LAST_EXPORT_NOTIFICATION_KEY)

  if (lastPromptPeriod === periodKey) {
    return false
  }

  return hasCompleteFortnight(activeEmployeeId, now)
}

export const runNotificationChecks = async (activeEmployeeId: number | null) => {
  if (typeof window === 'undefined') {
    return
  }

  const support = getNotificationSupport()

  if (!support.notifications || !support.serviceWorker || Notification.permission !== 'granted') {
    return
  }

  const settings = getNotificationSettings()
  const now = new Date()
  const todayKey = formatDateKey(now)

  if (shouldSendDailyReminder(settings, now)) {
    await showAppNotification('Werkdag loggen?', {
      body: 'Open timesheet en registreer je werkdag.',
      tag: 'daily-reminder',
      data: { url: '/?tab=today&repeatReady=1' },
    })
    window.localStorage.setItem(LAST_DAILY_NOTIFICATION_KEY, todayKey)
  }

  if (await shouldSendFridayExportPrompt(settings, now, activeEmployeeId)) {
    const fortnightDates = getFortnightDates(getStartOfWeek(now))
    await showAppNotification('2 weken compleet? Exporteer en verstuur.', {
      body: 'Je 2-wekelijks overzicht staat klaar om te exporteren.',
      tag: 'friday-export-prompt',
      data: { url: '/?tab=week&exportPrompt=1' },
    })
    window.localStorage.setItem(
      LAST_EXPORT_NOTIFICATION_KEY,
      `${formatDateKey(fortnightDates[0])}_${formatDateKey(fortnightDates[13])}`,
    )
  }
}
