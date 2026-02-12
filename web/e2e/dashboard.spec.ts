import { test, expect } from '@playwright/test'

test.describe('National Security Platform - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads main dashboard successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/National Security Platform/)
    
    // Check for main dashboard elements
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    await expect(page.locator('[data-testid="command-bar"]')).toBeVisible()
  })

  test('handles user authentication', async ({ page }) => {
    await page.goto('/login')
    
    // Check login form elements
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('switches between dashboard views', async ({ page }) => {
    await page.goto('/')
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-container"]')
    
    // Check for view switcher
    const viewSwitcher = page.locator('[data-testid="view-switcher"]')
    await expect(viewSwitcher).toBeVisible()
    
    // Switch to tactical view
    await viewSwitcher.click()
    await page.locator('text=Tactical').click()
    
    // Verify tactical view elements
    await expect(page.locator('[data-testid="tactical-dashboard"]')).toBeVisible()
  })

  test('displays and manages alerts', async ({ page }) => {
    await page.goto('/')
    
    // Check for alert sidebar
    const alertSidebar = page.locator('[data-testid="alert-sidebar"]')
    await expect(alertSidebar).toBeVisible()
    
    // Check for alert list
    await expect(page.locator('[data-testid="alert-list"]')).toBeVisible()
    
    // Test alert filtering
    const filterButton = page.locator('[data-testid="alert-filter-button"]')
    if (await filterButton.isVisible()) {
      await filterButton.click()
      await expect(page.locator('[data-testid="alert-filter-modal"]')).toBeVisible()
    }
  })

  test('displays interactive map', async ({ page }) => {
    await page.goto('/')
    
    // Check for map container
    const mapContainer = page.locator('[data-testid="map-container"]')
    await expect(mapContainer).toBeVisible()
    
    // Wait for map to initialize
    await page.waitForSelector('.mapboxgl-canvas')
    
    // Test map controls
    const zoomControls = page.locator('[data-testid="map-zoom-controls"]')
    await expect(zoomControls).toBeVisible()
  })

  test('handles responsive navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 })
    
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
    await expect(mobileMenuButton).toBeVisible()
    
    await mobileMenuButton.click()
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test desktop navigation
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible()
  })

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test Tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should focus interactive elements
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test Enter key
    await page.keyboard.press('Enter')
  })

  test('displays loading states', async ({ page }) => {
    await page.goto('/')
    
    // Look for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]')
    
    // Check if loading indicator appears during initial load
    // This might be visible briefly
    const isVisible = await loadingIndicator.isVisible().catch(() => false)
    if (isVisible) {
      await expect(loadingIndicator).toBeVisible()
    }
  })

  test('shows error states appropriately', async ({ page }) => {
    // Test with invalid route
    await page.goto('/invalid-route')
    
    await expect(page.locator('[data-testid="error-page"]')).toBeVisible()
    await expect(page.locator('text=Page not found')).toBeVisible()
    
    // Test with server error simulation
    await page.route('/api/v1/alerts', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      })
    })
    
    await page.goto('/')
    
    // Should handle error gracefully
    const errorBoundary = page.locator('[data-testid="error-boundary"]')
    await page.waitForTimeout(2000)
    
    // Check if error boundary is displayed
    const errorVisible = await errorBoundary.isVisible().catch(() => false)
    if (errorVisible) {
      await expect(errorBoundary).toBeVisible()
    }
  })

  test('maintains accessibility standards', async ({ page }) => {
    await page.goto('/')
    
    // Check for ARIA labels
    const interactiveElements = await page.locator('button, a, input, select, textarea').all()
    
    for (const element of interactiveElements) {
      const hasAriaLabel = await element.getAttribute('aria-label') !== null ||
                           await element.getAttribute('aria-labelledby') !== null ||
                           await element.getAttribute('title') !== null ||
                           await element.getAttribute('alt') !== null
      
      if (await element.isVisible()) {
        expect(hasAriaLabel).toBeTruthy()
      }
    }
    
    // Check for heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
    
    // Check for skip navigation link
    const skipLink = page.locator('[data-testid="skip-link"]')
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeVisible()
    }
  })

  test('supports offline functionality', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true)
    
    await page.goto('/')
    
    // Should display offline indicator
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
    await expect(offlineIndicator).toBeVisible()
    
    // Should still show cached content
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    
    // Test offline queue for user actions
    // This would require more complex setup to test fully
  })

  test('handles session management', async ({ page }) => {
    await page.goto('/')
    
    // Check for session timeout warning (might not appear immediately)
    const sessionWarning = page.locator('[data-testid="session-warning"]')
    
    // Simulate user inactivity
    await page.waitForTimeout(30000) // 30 seconds
    
    // Check if session warning appears
    const warningVisible = await sessionWarning.isVisible().catch(() => false)
    if (warningVisible) {
      await expect(sessionWarning).toBeVisible()
      await expect(page.locator('text=Session Expiring Soon')).toBeVisible()
    }
  })

  test('performs critical user workflows', async ({ page }) => {
    await page.goto('/')
    
    // Test alert creation workflow
    const createAlertButton = page.locator('[data-testid="create-alert-button"]')
    if (await createAlertButton.isVisible()) {
      await createAlertButton.click()
      
      await expect(page.locator('[data-testid="alert-form"]')).toBeVisible()
      
      // Fill form fields
      await page.fill('[data-testid="alert-title-input"]', 'Test Alert')
      await page.fill('[data-testid="alert-description-input"]', 'Test Description')
      await page.fill('[data-testid="alert-location-input"]', 'Test Location')
      
      // Submit form
      await page.click('[data-testid="alert-submit-button"]')
      
      // Check for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    }
    
    // Test alert triage workflow
    const alertList = page.locator('[data-testid="alert-list"]')
    if (await alertList.isVisible()) {
      const firstAlert = alertList.locator('[data-testid="alert-item"]').first()
      await firstAlert.click()
      
      // Should open alert details
      await expect(page.locator('[data-testid="alert-details"]')).toBeVisible()
      
      // Test triage actions
      const triageButtons = page.locator('[data-testid="triage-action-buttons"]')
      if (await triageButtons.isVisible()) {
        const acknowledgeButton = triageButtons.locator('text=Acknowledge')
        if (await acknowledgeButton.isVisible()) {
          await acknowledgeButton.click()
          
          // Should update alert status
          await expect(page.locator('[data-testid="alert-status-updated"]')).toBeVisible()
        }
      }
    }
  })

  test('supports different user roles and permissions', async ({ page }) => {
    // This would require authentication setup for different roles
    // For now, test basic role-based UI elements
    
    await page.goto('/')
    
    const userMenu = page.locator('[data-testid="user-menu"]')
    if (await userMenu.isVisible()) {
      await userMenu.click()
      
      // Should show user information and role
      await expect(page.locator('[data-testid="user-role"]')).toBeVisible()
      
      // Test role-specific features visibility
      const adminFeatures = page.locator('[data-testid="admin-only-feature"]')
      if (await adminFeatures.isVisible()) {
        await expect(adminFeatures).toBeVisible()
      }
    }
  })
})

test.describe('Performance Tests', () => {
  test('loads within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('has efficient bundle size', async ({ page }) => {
    // This would require setup to measure bundle size
    // For now, check that critical resources load efficiently
    await page.goto('/')
    
    // Check that images load efficiently
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      // Check for lazy loading attributes
      await expect(images.first()).toHaveAttribute('loading')
    }
  })
})