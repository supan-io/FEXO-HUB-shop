/* FEXO HUB configuration */
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

/* Create this admin account in Firebase Authentication > Email/Password */
const ADMIN_EMAIL = "admin@fexohub.com";

/* Default website content. Admin can change all of these from the dashboard. */
const DEFAULT_CONTENT = {
  siteName: "FEXO HUB",
  eyebrow: "NEXT-GEN ONLINE STORE",
  title: "FEXO HUB",
  text: "Discover curated products in a futuristic neon shopping universe.",
  sponsorTitle: "Partner with FEXO HUB",
  sponsorText: "Get your brand featured across the store and reach engaged shoppers.",
  sponsorLink: "mailto:your-email@example.com"
};