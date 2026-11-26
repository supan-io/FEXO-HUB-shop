# FEXO HUB

Neon electro shopping site powered by Firebase (Firestore + Storage + Authentication).

## Files
index.html, style.css, script.js, config.js, firestore.rules, storage.rules, README.md

## Setup checklist
1. Firebase Authentication: enable Google and Email/Password. Add user itzsupan@gmail.com with a password.
2. Firestore: create database (default), paste firestore.rules, Publish.
3. Storage: enable (needs Blaze plan), paste storage.rules, Publish.
4. Authentication > Settings > Authorized domains: add YOUR-USERNAME.github.io
5. Upload all files to GitHub, then Settings > Pages > Branch main > Save.

## Admin
Open the site, press Admin, sign in with the admin email and password.
Add topics/pages, products (with unlimited images), songs, and edit site text.
Changes are stored in Firebase, so every visitor sees them immediately.
