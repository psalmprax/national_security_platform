'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallPrompt {
  isSupported: boolean
  isInstalled: boolean
  isInstallable: boolean
  installPrompt: BeforeInstallPromptEvent | null
  install: () => Promise<boolean>
  dismiss: () => void
}

export function usePWAInstall(): PWAInstallPrompt {
  const [isSupported, setIsSupported] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if PWA is supported
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      setIsSupported(supported)
    }

    // Check if app is already installed
    const checkInstalled = () => {
      // Check if running as standalone PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebApp = (window.navigator as any).standalone === true
      const isInstalled = isStandalone || isInWebApp

      setIsInstalled(isInstalled)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    checkSupport()
    checkInstalled()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!installPrompt) {
      return false
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setInstallPrompt(null)
        return true
      }

      return false
    } catch (error) {
      console.error('PWA install failed:', error)
      return false
    }
  }

  const dismiss = () => {
    if (installPrompt) {
      installPrompt.userChoice = Promise.resolve({
        outcome: 'dismissed' as const,
        platform: ''
      })
      setInstallPrompt(null)
      setIsInstallable(false)
    }
  }

  return {
    isSupported,
    isInstalled,
    isInstallable,
    installPrompt,
    install,
    dismiss,
  }
}

// Hook for managing PWA updates
export function usePWAUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    // Listen for service worker updates
    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true)
    }

    const handleUpdateComplete = () => {
      setIsUpdateAvailable(false)
      setIsUpdating(false)
      setUpdateError(null)
    }

    const handleUpdateError = (error: Error) => {
      setIsUpdating(false)
      setUpdateError(error.message)
    }

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        handleUpdateAvailable()
      } else if (event.data?.type === 'UPDATE_COMPLETE') {
        handleUpdateComplete()
      } else if (event.data?.type === 'UPDATE_ERROR') {
        handleUpdateError(new Error(event.data.error))
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  const update = async (): Promise<boolean> => {
    if (!navigator.serviceWorker) {
      return false
    }

    setIsUpdating(true)
    setUpdateError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.update()

      // Wait for update to complete
      await new Promise((resolve) => {
        const checkUpdate = () => {
          if (!isUpdateAvailable) {
            resolve(true)
          } else {
            setTimeout(checkUpdate, 1000)
          }
        }
        checkUpdate()
      })

      return true
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Update failed')
      return false
    }
  }

  const dismiss = () => {
    setIsUpdateAvailable(false)
    setUpdateError(null)
  }

  return {
    isUpdateAvailable,
    isUpdating,
    updateError,
    update,
    dismiss,
  }
}

// Hook for managing PWA notifications
export function usePWANotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window

      setIsSupported(supported)
    }

    const checkPermission = () => {
      if ('Notification' in window) {
        setPermission(Notification.permission)
      }
    }

    const checkSubscription = async () => {
      if (!navigator.serviceWorker) {
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
      } catch (error) {
        console.error('Failed to check push subscription:', error)
      }
    }

    checkSupport()
    checkPermission()
    checkSubscription()
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      })

      setSubscription(subscription)
      return true
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) {
      return false
    }

    try {
      await subscription.unsubscribe()
      setSubscription(null)
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      return null
    }

    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge.png',
      tag: 'nsp-notification',
      requireInteraction: false,
      ...options,
    })
  }

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  }
}

// Helper function for VAPID key conversion
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}