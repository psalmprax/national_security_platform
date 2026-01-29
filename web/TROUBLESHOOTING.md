# Resolving "Module Not Found" Errors

If you see red lines under `import React` or other packages, please follow these steps. These are **environment issues**, not code bugs.

## Why it's happening
The project uses **Next.js** and **TypeScript**. These require the `node_modules` folder to be present for the editor to "know" what `react` or `lucide-react` are. Since `node_modules` are huge, they are not included in the repository.

## The Solution (Run this on your local machine)

1.  **Install Node.js**: Ensure you have Node.js (v18 or v20) installed.
2.  **Navigate to web folder**:
    ```bash
    cd web
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
    *This generates the `node_modules` folder and the red lines will disappear immediately.*

## Running via Docker (No local Node needed)
If you don't want to install Node locally, you can use the provided Docker setup. Docker will handle the installation inside a container:
```bash
docker-compose up --build web-dashboard
```

**Rest assured: The code on line 3 is 100% correct according to React/Next.js standards.**
