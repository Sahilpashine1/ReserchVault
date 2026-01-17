/**
 * API Configuration
 * This file manages the API endpoint based on the environment
 */

// Automatically detect if we're in development or production
const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

// API Base URL Configuration
const API_CONFIG = {
    // For local development
    development: 'http://localhost:5000',

    // For production - UPDATE THIS with your Render backend URL after deployment
    // Example: 'https://faculty-publications-api.onrender.com'
    production: 'REPLACE_WITH_YOUR_RENDER_BACKEND_URL'
};

// Export the appropriate API URL
const API_BASE_URL = isLocalhost ? API_CONFIG.development : API_CONFIG.production;

// Log current configuration (helpful for debugging)
console.log('🔧 API Configuration:', {
    environment: isLocalhost ? 'development' : 'production',
    apiUrl: API_BASE_URL
});

// Export for use in other files
window.API_BASE_URL = API_BASE_URL;
