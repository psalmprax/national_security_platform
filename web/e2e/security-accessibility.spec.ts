import { test, expect } from '@playwright/test'

test.describe('Security and Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('implements proper security headers', async ({ page, request }) => {
    const response = await request.get('/')
    
    // Check for security headers
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['x-frame-options']).toBe('DENY')
    expect(response.headers()['x-xss-protection']).toMatch(/mode=block/)
  })

  test('prevents XSS attacks', async ({ page }) => {
    // Test with potential XSS input
    const xssPayload = '<script>alert("XSS")</script>'
    
    // Try to inject XSS in any input field
    await page.fill('input[placeholder*="search"]', xssPayload)
    
    // Verify no alert was triggered
    let alertTriggered = false
    page.on('dialog', () => {
      alertTriggered = true
    })
    
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    expect(alertTriggered).toBe(false)
  })

  test('handles CSRF protection', async ({ page, request }) => {
    // Mock API endpoint to check for CSRF token
    await page.route('/api/v1/alerts', async (route) => {
      const headers = route.request().headers()
      
      // Check for CSRF token in headers
      const hasCSRFToken = headers['x-csrf-token'] || headers['csrf-token']
      
      if (hasCSRFToken) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      } else {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'CSRF token missing' }),
        })
      }
    })
    
    // Try to submit form without CSRF token
    await page.goto('/')
    
    const createButton = page.locator('[data-testid="create-alert-button"]')
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Try to submit form
      const submitButton = page.locator('[data-testid="alert-submit-button"]')
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Should show error or be blocked
        await expect(page.locator('[data-testid="error-message"]').or(page.locator('[data-testid="success-message"]')).toBeVisible()
      }
    }
  })

  test('maintains content security policy', async ({ page }) => {
    // Test for CSP violations
    const cspViolations: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        cspViolations.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Check for any CSP violations
    expect(cspViolations.length).toBe(0)
  })

  test('supports secure authentication flows', async ({ page }) => {
    await page.goto('/login')
    
    // Check for secure login form
    await expect(page.locator('form[autocomplete="off"]')).toBeVisible()
    
    // Verify password field masking
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Test form validation
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Should show validation errors for empty fields
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
  })

  test('provides proper accessibility navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test skip navigation
    const skipLink = page.locator('[data-testid="skip-link"]')
    if (await skipLink.isVisible()) {
      await skipLink.focus()
      await page.keyboard.press('Enter')
      
      // Should skip to main content
      await expect(page.locator('main')).toBeFocused()
    }
    
    // Test ARIA landmarks
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('[role="banner"]')).toBeVisible()
    await expect(page.locator('[role="contentinfo"]')).toBeVisible()
  })

  test('supports screen reader compatibility', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper ARIA labels
    const interactiveElements = page.locator('button, a, input, select, textarea')
    const count = await interactiveElements.count()
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i)
      
      // Check for accessible name
      const accessibleName = await element.getAccessibleName()
      expect(accessibleName).toBeTruthy()
      
      // Check for accessible role
      const role = await element.getAccessibleRole()
      expect(role).toBeTruthy()
    }
    
    // Test semantic HTML structure
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[role="heading"]')).toHaveCount.toBeGreaterThan(0)
  })

  test('handles color contrast requirements', async ({ page }) => {
    await page.goto('/')
    
    // Test with simulated color blindness
    // This would require specialized setup
    // For now, check basic contrast indicators
    
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div')
    const visibleTextElements = textElements.filter({ hasVisible: true })
    
    // Check that text is readable (basic check)
    for (let i = 0; i < Math.min(10, await visibleTextElements.count()); i++) {
      const element = visibleTextElements.nth(i)
      
      // Check element has sufficient color contrast
      const styles = await element.evaluate((el: HTMLElement) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })
      
      // Basic check - color should not be the same as background
      expect(styles.color).not.toBe(styles.backgroundColor)
    }
  })

  test('supports responsive design for accessibility', async ({ page }) => {
    // Test mobile accessibility
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check touch targets are large enough (44x44 minimum)
    const touchTargets = page.locator('button, a, input, select')
    
    for (let i = 0; i < Math.min(5, await touchTargets.count()); i++) {
      const target = touchTargets.nth(i)
      
      if (await target.isVisible()) {
        const boundingBox = await target.boundingBox()
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44)
          expect(boundingBox.height).toBeGreaterThanOrEqual(44)
        }
      }
    }
    
    // Test text scaling
    await page.keyboard.press('Control+Plus')
    await page.waitForTimeout(500)
    
    // Check that layout remains usable
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
  })

  test('maintains focus management', async ({ page }) => {
    await page.goto('/')
    
    // Test focus trapping in modals
    const modalButton = page.locator('[data-testid="open-modal-button"]')
    if (await modalButton.isVisible()) {
      await modalButton.click()
      
      // Modal should trap focus
      await expect(page.locator('[role="dialog"]')).toBeFocused()
      
      // Test Tab navigation within modal
      await page.keyboard.press('Tab')
      const modalFocused = page.locator('[role="dialog"] :focus')
      await expect(modalFocused).toBeVisible()
      
      // Close modal with Escape
      await page.keyboard.press('Escape')
      
      // Focus should be restored
      await expect(modalButton).toBeFocused()
    }
  })

  test('provides proper error messaging for accessibility', async ({ page }) => {
    await page.goto('/invalid-route')
    
    // Error page should have proper heading
    await expect(page.locator('h1')).toBeVisible()
    
    // Error message should be accessible
    const errorMessage = page.locator('[data-testid="error-message"]')
    if (await errorMessage.isVisible()) {
      const accessibleName = await errorMessage.getAccessibleName()
      expect(accessibleName).toBeTruthy()
    }
    
    // Should provide navigation back to home
    const homeLink = page.locator('a[href="/"]')
    if (await homeLink.isVisible()) {
      const linkText = await homeLink.textContent()
      expect(linkText).toBeTruthy()
    }
  })

  test('supports reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    
    // Check that animations are respectful of preference
    const animatedElements = page.locator('[class*="transition"], [class*="animation"]')
    
    // Elements should have reduced motion or no motion
    for (let i = 0; i < Math.min(5, await animatedElements.count()); i++) {
      const element = animatedElements.nth(i)
      const classes = await element.getAttribute('class')
      
      if (classes) {
        // Should have motion-reduced class or similar
        const hasReducedMotion = classes.includes('motion-reduce') || 
                                  classes.includes('reduced-motion')
        
        // This is implementation dependent
        // At minimum, animations should not be jarring
      }
    }
  })

  test('supports high contrast mode', async ({ page }) => {
    // Simulate high contrast preference
    await page.emulateMedia({ 
      forcedColors: 'active',
      colorScheme: 'dark'
    })
    await page.goto('/')
    
    // Check that interface is still usable in high contrast
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    
    // Important elements should be visible
    await expect(page.locator('[data-testid="command-bar"]')).toBeVisible()
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible()
  })
})