/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        unoptimized: true,
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com; img-src 'self' blob: data: https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:8002 http://127.0.0.1:8002 https://*.mapbox.com https://events.mapbox.com http://130.61.26.105:8086 https://130.61.26.105:8443; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' blob:; frame-ancestors 'self';",
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self)',
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig
