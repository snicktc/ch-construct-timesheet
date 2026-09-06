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

const mockSettingsPage = vi.fn()

vi.mock('./pages/SettingsPage', () => ({
  SettingsPage: (props: unknown) => {
    mockSettingsPage(props)
    return <div>Settings page</div>
  },
}))

const profile = {
  id: 1,
  name: 'Milan',
  exportRecipient: 'CH Construct',
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
}

const profilesApi = (overrides: Record<string, unknown> = {}) => ({
  profiles: [profile],
  activeProfiles: [profile],
  loading: false,
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  setProfileActiveState: vi.fn(),
  deleteProfile: vi.fn(),
  ...overrides,
})

describe('App', () => {
  beforeEach(() => {
    mockRunNotificationChecks.mockReset()
    mockSettingsPage.mockReset()
    window.history.replaceState({}, '', '/')
  })

  it('shows the welcome flow and validates required fields', async () => {
    const createProfile = vi.fn().mockResolvedValue(1)
    const user = userEvent.setup()

    mockUseProfiles.mockReturnValue(profilesApi({ profiles: [], activeProfiles: [], createProfile }))
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: null,
      activeEmployeeId: null,
      loading: false,
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

    mockUseProfiles.mockReturnValue(profilesApi())
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: null,
      activeEmployeeId: null,
      loading: false,
      setActiveEmployeeId,
    })

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Profiel herstellen' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Milan · CH Construct' }))

    expect(setActiveEmployeeId).toHaveBeenCalledWith(1)
  })

  it('shows a loading state instead of the recovery flow while the active profile is still loading', () => {
    // Startup race: profiles have arrived, but the stored active employee has
    // not been read yet. The recovery panel must not flash in this window.
    mockUseProfiles.mockReturnValue(profilesApi())
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: null,
      activeEmployeeId: 1,
      loading: true,
      setActiveEmployeeId: vi.fn(),
    })

    render(<App />)

    expect(screen.getByText('Laden...')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Profiel herstellen' })).not.toBeInTheDocument()
    expect(screen.queryByText('Today page')).not.toBeInTheDocument()
  })

  it('passes the shared profiles api down to the settings page', () => {
    window.history.replaceState({}, '', '/?tab=settings')
    const api = profilesApi()
    mockUseProfiles.mockReturnValue(api)
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: profile,
      activeEmployeeId: 1,
      loading: false,
      setActiveEmployeeId: vi.fn(),
    })

    render(<App />)

    expect(mockSettingsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        profiles: [profile],
        loading: false,
        createProfile: api.createProfile,
        updateProfile: api.updateProfile,
        setProfileActiveState: api.setProfileActiveState,
        deleteProfile: api.deleteProfile,
      }),
    )
  })

  it('opens the settings tab from URL query parameters and runs notification checks', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    window.history.replaceState({}, '', '/?tab=settings&repeatReady=1&exportPrompt=1')

    mockUseProfiles.mockReturnValue(profilesApi())
    mockUseActiveProfile.mockReturnValue({
      activeEmployee: profile,
      activeEmployeeId: 1,
      loading: false,
      setActiveEmployeeId: vi.fn(),
    })

    render(<App />)

    expect(screen.getByText('Settings page')).toBeVisible()
    expect(mockRunNotificationChecks).toHaveBeenCalledWith(1)
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/')
  })
})
