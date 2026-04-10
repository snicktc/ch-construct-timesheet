export const LEGACY_APP_NAME = 'ch-timesheet'

export const ACTIVE_PROFILE_STORAGE_KEY = 'timesheet.activeEmployeeId'
export const NOTIFICATION_SETTINGS_STORAGE_KEY = 'timesheet.notificationSettings'
export const LAST_DAILY_NOTIFICATION_KEY = 'timesheet.lastDailyNotificationDate'
export const LAST_EXPORT_NOTIFICATION_KEY = 'timesheet.lastExportPromptPeriod'
export const LEGACY_MIGRATION_KEY = 'timesheet.migratedFromChTimesheet'

export const LEGACY_ACTIVE_PROFILE_STORAGE_KEY = 'ch-timesheet.activeEmployeeId'
export const LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY = 'ch-timesheet.notificationSettings'
export const LEGACY_LAST_DAILY_NOTIFICATION_KEY = 'ch-timesheet.lastDailyNotificationDate'
export const LEGACY_LAST_EXPORT_NOTIFICATION_KEY = 'ch-timesheet.lastExportPromptPeriod'

export const APP_STORAGE_KEYS = [
  ACTIVE_PROFILE_STORAGE_KEY,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
  LAST_DAILY_NOTIFICATION_KEY,
  LAST_EXPORT_NOTIFICATION_KEY,
] as const

export const LEGACY_APP_STORAGE_KEYS = [
  LEGACY_ACTIVE_PROFILE_STORAGE_KEY,
  LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY,
  LEGACY_LAST_DAILY_NOTIFICATION_KEY,
  LEGACY_LAST_EXPORT_NOTIFICATION_KEY,
] as const
