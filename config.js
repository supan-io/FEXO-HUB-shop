// FEXO HUB Configuration
const CONFIG = {
    // Google OAuth Client ID - Replace with your own
    GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    
    // Admin credentials (change in production)
    ADMIN_EMAIL: "admin@fexohub.com",
    DEFAULT_ADMIN_PASSWORD: "admin123",
    
    // Storage keys
    STORAGE_KEYS: {
        TOPICS: 'fexo_topics',
        PRODUCTS: 'fexo_products',
        CART: 'fexo_cart',
        USER: 'fexo_user',
        MUSIC: 'fexo_music',
        ADMIN: 'fexo_admin',
        ADMIN_PASS: 'fexo_admin_pass'
    },
    
    // App info
    APP_NAME: "FEXO HUB",
    CURRENCY: "USD",
    CURRENCY_SYMBOL: "$",
    
    // Preview settings
    PREVIEW: {
        enabled: true,
        url: window.location.href
    }
};

// Default topics if none exist
const DEFAULT_TOPICS = [
    { id: 'electronics', name: 'Electronics', emoji: '📱' },
    { id: 'fashion', name: 'Fashion', emoji: '👕' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮' }
];
