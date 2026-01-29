# National Security Dashboard (Next.js)

This is a blueprint implementation of the Intelligence Triage Dashboard.

## ⚠️ IDE Lint Errors
You may see "Module not found" or "JSX element has type any" errors in your editor. This is because:
1. `node_modules` are not committed to the repository.
2. The current environment does not have `npm` installed to fetch types.

**These are NOT code errors.** They will be resolved automatically when the Docker container builds the project using the provided `Dockerfile`.

## To Run Manually (with Node installed)
1. `cd web`
2. `npm install`
3. `npm run dev`

## To Run via Docker
1. `docker-compose build web-dashboard`
2. `docker-compose up web-dashboard`

## 🚀 Key Features

### 1. Agency Command Portal
- **URL**: `/agency/portal`
- **Purpose**: Admin interface for response agencies (Police, Army, Medical).
- **Capabilities**: Deployed assets are stored in the database (`assets` table) and visualized in real-time.

### 2. Live Situational Map
- **URL**: `/`
- **Purpose**: Real-time geospatial visualization.
- **Integration**: Toggle the "Shield" icon to see live assets fetched from the backend API.

