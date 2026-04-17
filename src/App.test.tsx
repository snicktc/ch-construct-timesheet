import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

const mockUseProfiles = vi.fn()
const mockUseActiveProfile = vi.fn()
const mockRunNotificationChecks = vi.fn()

vi.mock('./hooks/useProfiles', () => ({
  useProfiles: () => mockUseProfiles(),
}))

vi.mock('./hooks/useActiveProfile', () => ({
  useActiveProfile: () => mockUseActiveProfile(),
}))

vi.mock('./utils/notifications', () => ({
  runNotificationChecks: (...args: unknown[]) => mockRunNotificationChecks(...args),
}))

vi.mock('./pages/TodayPage', () => ({
  TodayPage: () => <div>Today page</div>,
}))

vi.mock('./pages/WeekPage', () => ({
  WeekPage: () => <div>Week page</div>,
}))

vi.mock('./pages/ClientsPage', () => ({
  ClientsPage: () => <div>Clients page</div>,
}))

vi.mock('./pages/SettingsPage', () => ({
  SettingsPage: () => <div>Settings page</div>,
}))

const profile = {
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

describe('App', () => {
  beforeEach(() => {
    mockRunNotificationChecks.mockReset()
    window.history.replaceState({}, '', '/')
  })

  it('shows the welcome flow and validates required fields', async () => {
    const createProfile = vi.fn().mockResolvedValue(1)
    const user = userEvent.setup()

    mockUseProfiles.mockReturnValue({
      profiles: [],
      activeProfiles: [],
      loading: false,
      createProfile,
    })
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: null,
      activeEmployeeId: null,
      setActiveEmployeeId: vi.fn(),
    })

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(await screen.findByText('Naam en bestemmeling zijn verplicht.')).toBeVisible()

    await user.type(screen.getByLabelText('Naam'), 'Milan')
    await user.selectOptions(screen.getByLabelText('Export naar'), 'CH Construct')
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(createProfile).toHaveBeenCalledWith({ name: 'Milan', exportRecipient: 'CH Construct' })
  })

  it('shows the profile recovery flow when profile data exists but no active profile is loaded', async () => {
    const setActiveEmployeeId = vi.fn()
    const user = userEvent.setup()

    mockUseProfiles.mockReturnValue({
      profiles: [profile],
      activeProfiles: [profile],
      loading: false,
      createProfile: vi.fn(),
    })
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: null,
      activeEmployeeId: null,
      setActiveEmployeeId,
    })

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Profiel herstellen' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Milan · CH Construct' }))

    expect(setActiveEmployeeId).toHaveBeenCalledWith(1)
  })

  it('opens the settings tab from URL query parameters and runs notification checks', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    window.history.replaceState({}, '', '/?tab=settings&repeatReady=1&exportPrompt=1')

    mockUseProfiles.mockReturnValue({
      profiles: [profile],
      activeProfiles: [profile],
      loading: false,
      createProfile: vi.fn(),
    })
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: profile,
      activeEmployeeId: 1,
      setActiveEmployeeId: vi.fn(),
    })

    render(<App />)

    expect(screen.getByText('Settings page')).toBeVisible()
    expect(mockRunNotificationChecks).toHaveBeenCalledWith(1)
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/')
  })
})
