import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type Employee } from '../db/database'
import { SettingsPage } from './SettingsPage'

const mockUseProfiles = vi.fn()
const mockDownloadBackupFile = vi.fn()
const mockImportAllDataFromText = vi.fn()
const mockClearAllAppData = vi.fn()
const mockGetDefaultLogoForRecipient = vi.fn()
const mockResizeImageToDataUrl = vi.fn()
const mockRequestNotificationPermission = vi.fn()
const mockSaveNotificationSettings = vi.fn()
const mockShowAppNotification = vi.fn()

vi.mock('../hooks/useProfiles', () => ({
  useProfiles: () => mockUseProfiles(),
}))

vi.mock('../utils/dataTransfer', () => ({
  clearAllAppData: () => mockClearAllAppData(),
  downloadBackupFile: () => mockDownloadBackupFile(),
  importAllDataFromText: (...args: unknown[]) => mockImportAllDataFromText(...args),
}))

vi.mock('../utils/logoUtils', () => ({
  getDefaultLogoForRecipient: (...args: unknown[]) => mockGetDefaultLogoForRecipient(...args),
  resizeImageToDataUrl: (...args: unknown[]) => mockResizeImageToDataUrl(...args),
}))

vi.mock('../utils/notifications', async () => {
  const actual = await vi.importActual('../utils/notifications')
  return {
    ...actual,
    getNotificationSupport: () => ({ notifications: true, serviceWorker: true }),
    getNotificationSettings: () => ({
      dailyReminderEnabled: true,
      dailyReminderTime: '17:00',
      fridayExportPromptEnabled: true,
    }),
    requestNotificationPermission: (...args: unknown[]) => mockRequestNotificationPermission(...args),
    saveNotificationSettings: (...args: unknown[]) => mockSaveNotificationSettings(...args),
    showAppNotification: (...args: unknown[]) => mockShowAppNotification(...args),
  }
})

const profile: Employee = {
  id: 1,
  name: 'Milan',
  exportRecipient: 'CH Construct',
  exportLogo: '',
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
}

describe('SettingsPage', () => {
  beforeEach(() => {
    mockUseProfiles.mockReturnValue({
      profiles: [profile],
      loading: false,
      createProfile: vi.fn().mockResolvedValue(2),
      updateProfile: vi.fn().mockResolvedValue(undefined),
      setProfileActiveState: vi.fn().mockResolvedValue(undefined),
      deleteProfile: vi.fn().mockResolvedValue(undefined),
    })
    mockDownloadBackupFile.mockReset()
    mockImportAllDataFromText.mockReset()
    mockClearAllAppData.mockReset()
    mockGetDefaultLogoForRecipient.mockReset()
    mockResizeImageToDataUrl.mockReset()
    mockRequestNotificationPermission.mockReset()
    mockSaveNotificationSettings.mockReset()
    mockShowAppNotification.mockReset()
    mockRequestNotificationPermission.mockResolvedValue('granted')
    mockGetDefaultLogoForRecipient.mockResolvedValue('data:image/png;base64,default')
    mockShowAppNotification.mockResolvedValue(undefined)
    vi.spyOn(window.location, 'reload').mockImplementation(() => undefined)
  })

  it('creates a new profile from the editor sheet', async () => {
    const user = userEvent.setup()
    const createProfile = vi.fn().mockResolvedValue(2)
    mockUseProfiles.mockReturnValue({
      profiles: [profile],
      loading: false,
      createProfile,
      updateProfile: vi.fn(),
      setProfileActiveState: vi.fn(),
      deleteProfile: vi.fn(),
    })

    render(
      <SettingsPage activeEmployeeId={1} activeProfiles={[profile]} onSelectEmployee={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: '+ Nieuw' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nieuw profiel' })

    await user.type(within(dialog).getByLabelText('Naam'), 'Kevin')
    await user.type(within(dialog).getByLabelText('Export naar'), 'VBW')
    await user.click(within(dialog).getByRole('button', { name: 'Opslaan' }))

    await waitFor(() => {
      expect(createProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Kevin',
          exportRecipient: 'VBW',
          exportLogo: 'data:image/png;base64,default',
        }),
      )
    })
  })

  it('requests notification permission and triggers a test notification', async () => {
    const user = userEvent.setup()

    render(
      <SettingsPage activeEmployeeId={1} activeProfiles={[profile]} onSelectEmployee={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Vraag notificaties toe' }))
    await user.click(screen.getByRole('button', { name: 'Test notificatie' }))

    expect(mockRequestNotificationPermission).toHaveBeenCalled()
    expect(mockShowAppNotification).toHaveBeenCalledWith(
      'Werkdag loggen?',
      expect.objectContaining({ tag: 'test-notification' }),
    )
  })

  it('imports backup data only after confirmation', async () => {
    const user = userEvent.setup()
    mockImportAllDataFromText.mockResolvedValue(undefined)

    render(
      <SettingsPage activeEmployeeId={1} activeProfiles={[profile]} onSelectEmployee={vi.fn()} />,
    )

    const file = new File(['{"version":1,"data":{}}'], 'backup.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"][accept="application/json,.json"]') as HTMLInputElement
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue('{"version":1,"data":{}}') })

    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByRole('dialog', { name: 'Data importeren' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Ja, importeer' }))

    await waitFor(() => {
      expect(mockImportAllDataFromText).toHaveBeenCalledWith('{"version":1,"data":{}}')
    })
  })
})
