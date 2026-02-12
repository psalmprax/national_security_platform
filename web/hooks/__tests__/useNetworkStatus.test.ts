import { renderHook, act } from '@testing-library/react'
import useNetworkStatus from '../../hooks/useNetworkStatus'

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Mock navigator
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })

    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (test)',
    })

    // Mock window.addEventListener
    global.addEventListener = jest.fn()
    global.removeEventListener = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('initializes with default network status', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.networkQuality).toBeDefined()
    expect(result.current.offlineQueue).toEqual([])
    expect(result.current.connectionAttempts).toBe(0)
  })

  it('detects online status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
  })

  it('detects offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(false)
  })

  it('gets network information when available', () => {
    const mockConnection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    }

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: mockConnection,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.networkStatus.networkType).toBe('wifi')
    expect(result.current.networkStatus.effectiveType).toBe('4g')
    expect(result.current.networkStatus.downlink).toBe(10)
    expect(result.current.networkStatus.rtt).toBe(50)
  })

  it('calculates network quality correctly', () => {
    const { result } = renderHook(() => useNetworkStatus())

    // Test with mock data
    const mockConnection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    }

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: mockConnection,
    })

    // Quality should be 'excellent' for good 4g
    expect(result.current.getNetworkQuality()).toBe('excellent')
  })

  it('queues offline operations when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      result.current.queueOfflineOperation({
        type: 'api',
        url: '/api/test',
        method: 'POST',
        data: { test: 'data' },
        priority: 'high',
      })
    })

    expect(result.current.offlineQueue.length).toBe(1)
    expect(result.current.offlineQueue[0]).toMatchObject({
      type: 'api',
      url: '/api/test',
      method: 'POST',
      data: { test: 'data' },
      priority: 'high',
    })
  })

  it('does not queue operations when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      result.current.queueOfflineOperation({
        type: 'api',
        url: '/api/test',
        method: 'POST',
      })
    })

    // Should not queue when online
    expect(result.current.offlineQueue.length).toBe(0)
  })

  it('removes operation from queue', () => {
    const { result } = renderHook(() => useNetworkStatus())

    const operationId = 'test-operation-id'

    act(() => {
      result.current.queueOfflineOperation({
        id: operationId,
        type: 'api',
        url: '/api/test',
        method: 'POST',
      })
    })

    expect(result.current.offlineQueue.length).toBe(1)

    act(() => {
      result.current.removeOperation(operationId)
    })

    expect(result.current.offlineQueue.length).toBe(0)
  })

  it('clears offline queue', () => {
    const { result } = renderHook(() => useNetworkStatus())

    // Add multiple operations
    act(() => {
      result.current.queueOfflineOperation({
        type: 'api',
        url: '/api/test1',
        method: 'POST',
      })
      result.current.queueOfflineOperation({
        type: 'api',
        url: '/api/test2',
        method: 'POST',
      })
    })

    expect(result.current.offlineQueue.length).toBe(2)

    act(() => {
      result.current.clearQueue()
    })

    expect(result.current.offlineQueue.length).toBe(0)
  })

  it('detects when offline mode should be used', () => {
    const { result } = renderHook(() => useNetworkStatus())

    // Test with poor network
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        type: 'cellular',
        effectiveType: '2g',
        downlink: 0.1,
        rtt: 1000,
        saveData: true,
      },
    })

    expect(result.current.useOfflineMode()).toBe(true)
  })

  it('sets up event listeners', () => {
    renderHook(() => useNetworkStatus())

    // Should set up online/offline event listeners
    expect(global.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(global.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus())

    unmount()

    expect(global.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(global.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('handles connection change events', () => {
    const mockConnection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: mockConnection,
    })

    renderHook(() => useNetworkStatus())

    // Should listen to connection changes
    expect(mockConnection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})