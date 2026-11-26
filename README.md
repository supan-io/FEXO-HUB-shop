FEXO HUB — Firebase Connected
This version saves all website data in Firebase, so every visitor sees the same products, images, pages and music.
Files
index.html
style.css
script.js
config.js
firestore.rules
storage.rules
README.md
1. Create Firebase project
Go to https://console.firebase.google.com
Create a project.
Add a Web app.
Copy the Firebase config values.
Paste them into config.js.
2. Enable services
In Firebase Console enable:
Firestore Database
Storage
Authentication
Google sign-in provider
Email/Password sign-in provider
3. Create admin account
Go to Authentication > Users > Add user.
Create an account such as:
admin@fexohub.com
Then put the same email in config.js:
ADMIN_EMAIL = "admin@fexohub.com"
4. Add security rules
Paste firestore.rules into Firestore > Rules.
Paste storage.rules into Storage > Rules.
Important: replace admin@fexohub.com in both rule files with your real admin email.
5. Upload to GitHub
Upload all files to a GitHub repository.
Then enable GitHub Pages:
Settings > Pages > Branch: main > Save
Your website will be available at:
https://your-username.github.io/your-repository-name/
6. Add products
Open your website and click Admin.
Sign in with the admin email and password.
From the dashboard you can add:
Topics
Pages
Products
Product images
Prices
Offer countdowns
Music
Site content
Sponsor information
All changes are saved in Firebase and appear for every visitor immediately.
Music
You can upload unlimited songs.
Each song has:
Name
Audio file
Edit name option
Delete option
Play button
Customer access
Customers can browse the website without signing in.
To place an order, they must sign in with Google.
Customers cannot edit products, images, pages, music or website content.
Important
Do not share your Firebase config publicly if you want stronger security.
The Firebase config is safe to expose in a frontend website, but your admin password must remain private.
Security is enforced by Firestore and Storage rules, not by hiding the config.
