// config.js // Central LaunchPad HQ Topology Configuration
const CONFIG = {
    // Force the frontend to talk directly to your 24/7 Render API globally
    API_BASE_URL: 'https://launchpad-core-api.onrender.com'
};

// Freeze the object profile state variables to prevent runtime tampering
Object.freeze(CONFIG);