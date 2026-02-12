import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToastProvider, { useToast } from '../Toast'

// Test component to use toast
const TestComponent = () => {
  const { showToast, success, error, warning, info, clearToasts } = useToast()

  return (
    <div>
      <button onClick={() => success('Success message', 'Success Title')}>
        Show Success
      </button>
      <button onClick={() => error('Error message', 'Error Title')}>
        Show Error
      </button>
      <button onClick={() => warning('Warning message', 'Warning Title')}>
        Show Warning
      </button>
      <button onClick={() => info('Info message', 'Info Title')}>
        Show Info
      </button>
      <button onClick={() => showToast({ type: 'success', message: 'Custom success' })}>
        Show Custom
      </button>
      <button onClick={() => clearToasts()}>
        Clear All
      </button>
    </div>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders children without toasts initially', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const successButton = screen.getByRole('button', { name: 'Show Success' })
    userEvent.click(successButton)

    expect(screen.getByText('Success Title')).toBeInTheDocument()
    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByRole('alert', { name: /Success/ })).toBeInTheDocument()
  })

  it('shows error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const errorButton = screen.getByRole('button', { name: 'Show Error' })
    userEvent.click(errorButton)

    expect(screen.getByText('Error Title')).toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByRole('alert', { name: /Error/ })).toBeInTheDocument()
  })

  it('shows warning toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const warningButton = screen.getByRole('button', { name: 'Show Warning' })
    userEvent.click(warningButton)

    expect(screen.getByText('Warning Title')).toBeInTheDocument()
    expect(screen.getByText('Warning message')).toBeInTheDocument()
    expect(screen.getByRole('alert', { name: /Warning/ })).toBeInTheDocument()
  })

  it('shows info toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const infoButton = screen.getByRole('button', { name: 'Show Info' })
    userEvent.click(infoButton)

    expect(screen.getByText('Info Title')).toBeInTheDocument()
    expect(screen.getByText('Info message')).toBeInTheDocument()
    expect(screen.getByRole('alert', { name: /Info/ })).toBeInTheDocument()
  })

  it('shows custom toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const customButton = screen.getByRole('button', { name: 'Show Custom' })
    userEvent.click(customButton)

    expect(screen.getByText('Custom success')).toBeInTheDocument()
  })

  it('auto-dismisses non-persistent toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const infoButton = screen.getByRole('button', { name: 'Show Info' })
    userEvent.click(infoButton)

    // Toast should be visible initially
    expect(screen.getByText('Info Title')).toBeInTheDocument()

    // Fast-forward time
    jest.advanceTimersByTime(6000)

    // Toast should be removed
    expect(screen.queryByText('Info Title')).not.toBeInTheDocument()
  })

  it('keeps persistent toasts visible', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const errorButton = screen.getByRole('button', { name: 'Show Error' })
    userEvent.click(errorButton)

    // Fast-forward time
    jest.advanceTimersByTime(10000)

    // Error toast should still be visible (persistent by default)
    expect(screen.getByText('Error Title')).toBeInTheDocument()
  })

  it('removes toast on close button click', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const successButton = screen.getByRole('button', { name: 'Show Success' })
    userEvent.click(successButton)

    const closeButton = screen.getByLabelText('Close toast')
    userEvent.click(closeButton)

    expect(screen.queryByText('Success Title')).not.toBeInTheDocument()
  })

  it('clears all toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Show multiple toasts
    userEvent.click(screen.getByRole('button', { name: 'Show Success' }))
    userEvent.click(screen.getByRole('button', { name: 'Show Error' }))
    userEvent.click(screen.getByRole('button', { name: 'Show Warning' }))

    expect(screen.getByText('Success Title')).toBeInTheDocument()
    expect(screen.getByText('Error Title')).toBeInTheDocument()
    expect(screen.getByText('Warning Title')).toBeInTheDocument()

    // Clear all
    userEvent.click(screen.getByRole('button', { name: 'Clear All' }))

    expect(screen.queryByText('Success Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Error Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Warning Title')).not.toBeInTheDocument()
  })

  it('limits number of visible toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Show more toasts than the maximum
    for (let i = 0; i < 10; i++) {
      userEvent.click(screen.getByRole('button', { name: 'Show Info' }))
    }

    // Should only show maximum number (implementation specific)
    const toasts = screen.getAllByRole('alert')
    expect(toasts.length).toBeLessThanOrEqual(5) // Assuming max 5 toasts
  })

  it('applies correct styling for each type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Test success styling
    userEvent.click(screen.getByRole('button', { name: 'Show Success' }))
    const successToast = screen.getByRole('alert', { name: /Success/ })
    expect(successToast).toHaveClass(/text-green-400/)

    // Test error styling
    userEvent.click(screen.getByRole('button', { name: 'Show Error' }))
    const errorToast = screen.getByRole('alert', { name: /Error/ })
    expect(errorToast).toHaveClass(/text-red-400/)

    // Test warning styling
    userEvent.click(screen.getByRole('button', { name: 'Show Warning' }))
    const warningToast = screen.getByRole('alert', { name: /Warning/ })
    expect(warningToast).toHaveClass(/text-amber-400/)

    // Test info styling
    userEvent.click(screen.getByRole('button', { name: 'Show Info' }))
    const infoToast = screen.getByRole('alert', { name: /Info/ })
    expect(infoToast).toHaveClass(/text-blue-400/)
  })
})