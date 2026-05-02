/**
 * ResearchVault — Global Configuration
 * ──────────────────────────────────────────────────────────────────────────
 * Automatically detects the correct API base URL:
 *  - In development (localhost): uses http://localhost:3000/api
 *  - In production (real domain): uses the same origin as the page
 *
 * This means you NEVER need to change this file when deploying.
 * Just host the backend and frontend on the same domain/port.
 */

(function () {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;

    let apiBase;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development — backend always on port 3000
        apiBase = `http://${hostname}:3000/api`;
    } else {
        // Production — API served from same origin (same server)
        apiBase = `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
    }

    // Expose globally — all JS files use window.API_URL or window.API_BASE_URL
    window.API_URL = apiBase;
    window.API_BASE_URL = apiBase;

    if (window.location.hostname === 'localhost') {
        console.log(`[ResearchVault] API Base URL: ${apiBase} (development mode)`);
    }
})();
