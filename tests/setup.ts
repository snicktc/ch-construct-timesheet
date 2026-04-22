import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

Object.defineProperty(globalThis, '__BUILD_TIMESTAMP__', {
  configurable: true,
  value: '2026-04-17T00:00:00.000Z',
})

Object.defineProperty(globalThis, '__APP_VERSION__', {
  configurable: true,
  value: '1.0.0-test',
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia (voor responsive components)
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted'),
} as unknown as typeof Notification

// Mock navigator.share (Web Share API)
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

// Mock navigator.canShare
Object.defineProperty(navigator, 'canShare', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
})

// Suppress console errors in tests (optioneel)
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn((...args) => {
    // Filter out known React warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  })
})

afterEach(() => {
  console.error = originalError
})
