import { renderHook, act } from '@testing-library/react'
import useLoading from '../../hooks/useLoading'

describe('useLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useLoading())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.message).toBeUndefined()
  })

  it('initializes with custom initial message', () => {
    const { result } = renderHook(() => useLoading({ 
      initialMessage: 'Loading data...' 
    }))

    expect(result.current.message).toBe('Loading data...')
  })

  it('sets loading state with startLoading', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Processing...')
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.message).toBe('Processing...')
    expect(result.current.operation).toBeUndefined()
  })

  it('sets loading state with operation name', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Processing...', 'data-fetch')
    })

    expect(result.current.operation).toBe('data-fetch')
  })

  it('stops loading with stopLoading', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Processing...')
      result.current.stopLoading()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('updates progress with updateProgress', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Loading...')
      result.current.updateProgress(50)
    })

    expect(result.current.progress).toBe(50)
  })

  it('clamps progress between 0 and 100', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.updateProgress(-10)
    })
    expect(result.current.progress).toBe(0)

    act(() => {
      result.current.updateProgress(150)
    })
    expect(result.current.progress).toBe(100)
  })

  it('simulates progress', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Loading...')
      result.current.simulateProgress(2000, 4)
    })

    // Should start at 0%
    expect(result.current.progress).toBe(0)

    // Fast-forward through simulation
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    // Should be at 50% after 1 second (2 steps * 25%)
    expect(result.current.progress).toBe(50)

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    // Should be at 100% after 2 seconds
    expect(result.current.progress).toBe(100)
  })

  it('handles async operation with withLoading', async () => {
    const { result } = renderHook(() => useLoading())
    const mockOperation = jest.fn().mockResolvedValue('success')

    let operationResult: any

    await act(async () => {
      operationResult = await result.current.withLoading(mockOperation())
    })

    expect(mockOperation).toHaveBeenCalled()
    expect(operationResult).toBe('success')
    expect(result.current.isLoading).toBe(false)
  })

  it('handles async operation error with withLoading', async () => {
    const { result } = renderHook(() => useLoading())
    const error = new Error('Test error')
    const mockOperation = jest.fn().mockRejectedValue(error)

    await act(async () => {
      await result.current.withLoading(mockOperation())
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useLoading({ onSuccess }))
    const mockOperation = jest.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.withLoading(mockOperation())
    })

    expect(onSuccess).toHaveBeenCalledWith('success')
  })

  it('calls onError callback when provided', async () => {
    const onError = jest.fn()
    const error = new Error('Test error')
    const { result } = renderHook(() => useLoading({ onError }))
    const mockOperation = jest.fn().mockRejectedValue(error)

    await act(async () => {
      await result.current.withLoading(mockOperation())
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('applies timeout when specified', async () => {
    const onTimeout = jest.fn()
    const { result } = renderHook(() => useLoading({ 
      onTimeout,
      timeout: 1000 
    }))

    act(() => {
      result.current.startLoading('Loading...')
    })

    expect(result.current.isLoading).toBe(true)

    // Fast-forward past timeout
    act(() => {
      jest.advanceTimersByTime(1500)
    })

    expect(result.current.isLoading).toBe(false)
    expect(onTimeout).toHaveBeenCalled()
  })

  it('calculates duration correctly', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Loading...')
    })

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    // Duration should be updated (implementation specific)
    expect(result.current.duration).toBeGreaterThan(0)
  })

  it('clears timers on unmount', () => {
    const { unmount } = renderHook(() => useLoading())

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    unmount()

    // Verify cleanup (implementation specific)
    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(clearIntervalSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })
})