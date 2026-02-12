# Testing Framework Implementation Guide

## Overview

A comprehensive testing framework has been implemented for the National Security Platform frontend using Jest and Playwright. This framework ensures code quality, reliability, and performance across all components and user workflows.

## Architecture

### Unit & Integration Testing (Jest)
- **Framework**: Jest 29.7.0 with React Testing Library
- **Coverage**: 80% minimum threshold with higher requirements for critical components
- **Test Environment**: jsdom with comprehensive mocks
- **Mock Strategy**: API mocking, Web API mocks, Next.js navigation mocks

### End-to-End Testing (Playwright)
- **Framework**: Playwright 1.40.1
- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop, Mobile (Pixel 5), Tablet (iPad Pro)
- **Test Types**: Functional, Accessibility, Security, Performance

## Test Structure

### Directory Organization
```
web/
├── __tests__/                    # Global test configuration
├── components/__tests__/           # Component tests
├── hooks/__tests__/              # Custom hook tests
├── lib/__tests__/                # Utility library tests
├── e2e/                        # End-to-end tests
│   ├── dashboard.spec.ts         # Main dashboard workflows
│   ├── security-accessibility.spec.ts # Security & a11y tests
│   └── performance.spec.ts      # Performance benchmarks
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Test setup and mocks
└── playwright.config.ts          # Playwright configuration
```

## Implemented Tests

### Component Tests

**ErrorBoundary Tests** (`components/__tests__/ErrorBoundary.test.tsx`)
- ✅ Renders children when no error
- ✅ Catches errors and displays fallback UI
- ✅ Generates unique error IDs
- ✅ Logs errors to monitoring service
- ✅ Provides retry functionality
- ✅ Supports custom fallback UI

**Toast Notification Tests** (`components/__tests__/Toast.test.tsx`)
- ✅ Displays success, error, warning, info toasts
- ✅ Auto-dismisses non-persistent toasts
- ✅ Keeps persistent toasts visible
- ✅ Handles close button clicks
- ✅ Limits number of visible toasts
- ✅ Applies correct styling per type

**Modal Tests** (`components/__tests__/Modal.test.tsx`)
- ✅ Renders when open, hidden when closed
- ✅ Correct ARIA attributes (role, aria-modal)
- ✅ Closes on backdrop click and Escape key
- ✅ Traps and restores focus
- ✅ Supports different sizes and animations
- ✅ Prevents body scroll when open

**Loading State Tests** (`hooks/__tests__/useLoading.test.ts`)
- ✅ Initializes with default state
- ✅ Manages loading states with progress
- ✅ Handles async operations with loading feedback
- ✅ Supports timeout and retry logic
- ✅ Calculates operation duration
- ✅ Simulates progress for long operations

**Network Status Tests** (`hooks/__tests__/useNetworkStatus.test.ts`)
- ✅ Detects online/offline status
- ✅ Gets network information when available
- ✅ Calculates network quality
- ✅ Queues offline operations
- ✅ Manages offline queue operations
- ✅ Handles connection change events

### End-to-End Tests

**Dashboard Functionality** (`e2e/dashboard.spec.ts`)
- ✅ Main dashboard loads successfully
- ✅ User authentication workflows
- ✅ Dashboard view switching
- ✅ Alert display and management
- ✅ Interactive map functionality
- ✅ Responsive navigation
- ✅ Keyboard navigation support
- ✅ Loading and error states
- ✅ Critical user workflows
- ✅ Role-based features

**Security & Accessibility** (`e2e/security-accessibility.spec.ts`)
- ✅ Security headers implementation
- ✅ XSS attack prevention
- ✅ CSRF protection
- ✅ Content Security Policy compliance
- ✅ Secure authentication flows
- ✅ Accessibility navigation (ARIA, keyboard)
- ✅ Screen reader compatibility
- ✅ Color contrast requirements
- ✅ Responsive design for accessibility
- ✅ Focus management
- ✅ Error messaging for accessibility
- ✅ Reduced motion support
- ✅ High contrast mode

## Configuration Details

### Jest Configuration (`jest.config.js`)
```javascript
- Next.js integration
- jsdom environment
- Module path mapping (@/* aliases)
- Coverage collection from components, hooks, lib
- Coverage thresholds: 80% global, 85% components, 90% hooks
- Test matching patterns and exclusions
```

### Playwright Configuration (`playwright.config.ts`)
```typescript
- Multiple browsers: Chromium, Firefox, WebKit
- Mobile and tablet device support
- CI optimization (parallel execution, retries)
- Comprehensive reporting (HTML, screenshots, videos)
- Development server integration
- Trace and screenshot capture on failures
```

## Coverage Requirements

### Thresholds
- **Global**: 80% branches, functions, lines, statements
- **Components**: 85% (UI reliability critical)
- **Hooks**: 90% (core functionality critical)

### Collection Areas
- All React components
- Custom hooks and utilities
- API client functions
- Authentication flows

## Mocking Strategy

### Web APIs Mocked
- `navigator.onLine` - Network status
- `navigator.userAgent` - Browser detection
- `localStorage`/`sessionStorage` - Client storage
- `ResizeObserver` - Resize handling
- `IntersectionObserver` - Visibility tracking
- `WebSocket` - Real-time connections

### Next.js Mocks
- `useRouter` - Navigation hooks
- `useSearchParams` - URL parameters
- `next/image` - Image optimization

### External Libraries Mocked
- Mapbox GL JS - Map functionality
- Third-party APIs - External integrations

## Running Tests

### Development
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Component tests only
npm run test:components

# Hook tests only
npm run test:hooks
```

### Continuous Integration
```bash
# CI optimized tests
npm run test:ci
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Headed mode for debugging
npm run test:e2e:headed
```

## Performance Testing

### Load Time Benchmarks
- Initial page load: <3 seconds
- Interactive elements: <2 seconds
- Map initialization: <5 seconds

### Bundle Size Optimization
- Analyze with: `npm run analyze` (if configured)
- Critical resources: <500KB initial load
- Total bundle: <2MB compressed

## Security Testing

### Automated Security Tests
- Input validation and sanitization
- XSS prevention measures
- CSRF token validation
- Content Security Policy compliance
- Authentication flow security

### Manual Security Testing Checklist
- [ ] Penetration testing with OWASP ZAP
- [ ] Dependency vulnerability scanning
- [ ] Secret exposure checks
- [ ] Cross-origin resource sharing (CORS) validation

## Accessibility Testing

### WCAG 2.1 AA Compliance
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard navigation without mouse
- Color contrast ratios (4.5:1 minimum)
- Touch target sizes (44x44px minimum)
- Focus management and trapping
- Semantic HTML structure

### Accessibility Tools Integration
- Automated a11y testing in CI
- Screen reader testing workflows
- Color blindness simulation
- Keyboard-only navigation testing

## Best Practices

### Test Writing Guidelines
1. **Arrange-Act-Assert** pattern for clear test structure
2. **Descriptive test names** explaining what is being tested
3. **User-centric testing** focusing on workflows, not implementation
4. **Mocking strategy** - mock external dependencies, test internals
5. **Cleanup** - proper test isolation and cleanup

### Performance Best Practices
1. **Minimal DOM operations** in tests
2. **Efficient selectors** using data-testid attributes
3. **Wait strategies** - use explicit waits over sleeps
4. **Resource cleanup** between tests
5. **Parallel execution** where possible

### Security Best Practices
1. **Input sanitization** testing
2. **Authentication bypass** attempts
3. **Data exposure** validation
4. **Session management** security
5. **API endpoint** protection testing

## Integration with CI/CD

### GitHub Actions Integration
```yaml
- Test matrix across browsers
- Parallel test execution
- Coverage reporting
- Artifact collection
- Security scanning integration
```

### Quality Gates
- All tests must pass before merge
- Coverage thresholds must be met
- Security scans must be clean
- Performance budgets must be maintained

## Monitoring and Reporting

### Test Metrics
- Test execution time tracking
- Failure rate monitoring
- Coverage trend analysis
- Performance regression detection

### Reporting
- HTML test reports with screenshots
- Coverage reports with detailed breakdown
- Security scan reports
- Performance benchmark reports

## Maintenance

### Regular Updates
- Monthly dependency updates
- Quarterly test coverage reviews
- Semi-annual security audit updates
- Annual accessibility compliance review

### Documentation Updates
- Test case documentation for new features
- Mock updates for external changes
- Configuration updates for new requirements
- Best practices guide updates

## Troubleshooting

### Common Issues
1. **Test timeouts** - Increase timeout or optimize test
2. **Mock failures** - Update mocks for API changes
3. **Flaky tests** - Improve test isolation
4. **Coverage gaps** - Add tests for uncovered code
5. **Performance regressions** - Investigate bundle changes

### Debugging Strategies
1. Use `console.log` with test IDs for debugging
2. Playwright trace mode for step-by-step analysis
3. Jest interactive mode for test exploration
4. Browser DevTools integration for visual debugging

This comprehensive testing framework ensures the National Security Platform maintains high quality, security, and accessibility standards while supporting rapid development and deployment cycles.