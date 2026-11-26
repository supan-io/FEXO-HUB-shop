FEXO HUB
A modern neon/electro single-page shopping website with a built-in no-code admin dashboard.
Files
index.html — website interface
style.css — neon electro design and smooth animations
script.js — website features and admin controls
config.js — site name, admin password, Google Client ID, sponsor and music settings
README.md — setup guide
Run preview
Put all files in one folder.
Open index.html in Chrome, Edge, or Firefox.
For full Google sign-in functionality, host the folder on GitHub Pages, Netlify, Vercel, or any web hosting service.
Admin access
Click Admin.
Default password: fexo-admin-2026
Change it in config.js before publishing.
Admin can add/edit/delete:
Topics and unlimited pages
Products, prices, old prices, offer countdowns, and details
Unlimited product images
Background music by upload or direct audio URL
Hero text, site name, and sponsor section
Customer orders
Backup and restore data
Google sign-in
Customers can browse without signing in, but must sign in with Google before placing an order.
Create a Google Cloud OAuth 2.0 Web Client ID.
Add your live website address under Authorized JavaScript origins.
Paste the Client ID into googleClientId in config.js.
Until a Client ID is added, Google sign-in and ordering remain intentionally unavailable.
Data storage
Website content is saved in the browser using localStorage. Use Admin > Backup to download a JSON backup. For a production store with many products, connect a backend database later.
Performance
The interface uses GPU-friendly transforms, lazy-loaded images, and requestAnimationFrame, so animations can run at the display's maximum supported refresh rate, including 120 Hz displays.
