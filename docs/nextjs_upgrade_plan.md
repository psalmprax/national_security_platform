# Next.js 15 Upgrade Plan

Upgrade the National Security Platform's web dashboard from Next.js 14 to Next.js 15. This upgrade brings improved performance, better React 19 integration, and support for the latest web standards.

## Proposed Changes

### Web Dashboard
#### [MODIFY] [package.json](file:///home/psalmprax/national_security_platform/web/package.json)
- Upgrade `next` to `15.5.11` (explicitly pinned).
- **Do NOT manually pin @next/swc binaries**: Next.js 15 handles its own binary resolution (e.g. Next 15.5.11 uses SWC 15.5.7).
- Upgrade `react` and `react-dom` to `^19.0.0` to support Next.js 15.
- Update `@types/react` and `@types/react-dom` to `^19.0.0`.
- Verify third-party library compatibility (e.g., `framer-motion`, `mapbox-gl`).

#### [NEW] [.dockerignore](file:///home/psalmprax/national_security_platform/web/.dockerignore)
- Ignore `node_modules` and `.next` to prevent local stale artifacts from being copied into the build container.
- Ignore `.git`, `Dockerfile`, and other non-src files to optimize build context.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure the production build still passes with the new versions.
- Run `npm run lint` to check for any new linting rules or deprecation warnings.

### Manual Verification
- Start the development server (`npm run dev`) and verify:
  - Global theme switching functionality.
  - Dashboard navigation and real-time alert updates.
  - Login and registration flows.
  - Mapbox integration and interactive markers.
