import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import ErrorBoundary from '../ErrorBoundary'

// Mock error logging
jest.mock('../lib/errorLogger', () => ({
  errorLogger: {
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}))

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    expect(screen.getByText(/Test error/)).toBeInTheDocument()
  })

  it('generates unique error ID', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const errorIdElement = screen.getByText(/err_\d+_\w+/)
    expect(errorIdElement).toBeInTheDocument()
    
    // Verify it's a valid error ID format
    const errorId = errorIdElement.textContent
    expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/)
  })

  it('logs error to monitoring service', () => {
    const { errorLogger } = require('../lib/errorLogger')
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(errorLogger.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error',
      expect.objectContaining({
        type: 'react_error_boundary',
        message: 'Test error',
      }),
      'ErrorBoundary'
    )
  })

  it('displays development error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Development/)).toBeInTheDocument()
    expect(screen.getByText(/Stack Trace/)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('calls custom error handler if provided', () => {
    const onError = jest.fn()
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('uses custom fallback if provided', () => {
    const CustomFallback = () => <div>Custom error UI</div>
    
    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument()
  })

  it('provides retry functionality', async () => {
    let shouldThrow = true
    const TestComponent = () => {
      const [retryCount, setRetryCount] = React.useState(0)
      
      return (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
          <button onClick={() => {
            shouldThrow = false
            setRetryCount(prev => prev + 1)
          }}>
            Retry ({retryCount})
          </button>
        </ErrorBoundary>
      )
    }

    render(<TestComponent />)

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /Retry/ })
    await userEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })
})