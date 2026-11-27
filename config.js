const firebaseConfig={apiKey:"AIzaSyCfnHmflYAlp8qwlwLiuTubr0Z995yR8Uc",authDomain:"fexo-hub.firebaseapp.com",projectId:"fexo-hub",storageBucket:"fexo-hub.firebasestorage.app",messagingSenderId:"937734056640",appId:"1:937734056640:web:32329e4054e96a6fc51b25",measurementId:"G-3083DBYQF0"};
firebase.initializeApp(firebaseConfig);
const ADMIN_EMAIL="itzsupan@gmail.com";const SUPPORT_PHONE="01570267525";
const DEFAULT_CONTENT={siteName:"FEXO HUB",eyebrow:"NEXT-GEN STORE",title:"FEXO HUB",text:"Shop, play and enjoy.",sponsorTitle:"Grow your brand with FEXO HUB",sponsorText:"Reach engaged shoppers through sponsored placements.",sponsorLink:"mailto:itzsupan@gmail.com"};
/* ===== GAMES: AUTO =====
   GitHub e games/<gamename>/ folder upload korlei hub e auto show hobe.
   - Folder er nam = game id (lowercase, space chhara, jemon: rickshaw-city)
   - Optional: folder e game.json rakhle nam/desc/cover set hobe:
       {"name":"Rickshaw City","desc":"Short text","image":"cover.jpg","order":1}
     (na dile nam folder theke hobe, cover = cover.jpg)
   - Folder er nam _ ba . diye shuru korle hide thakbe. */
const GAMES_DIR="games";
const GITHUB_REPO="";   // "username/repo". Faka rakhle github.io URL theke auto dhorbe. Custom domain hole eita likhte hobe.
const GAMES=[];         // optional: manual override/extra (auto list er sathe merge hoy)
const LB_PAGE_SIZE=20;      // ekbare koyjon load hobe (infinite scroll)
const LB_CYCLE_DAYS=3;      // koyday por leaderboard reset
