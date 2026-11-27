const firebaseConfig={apiKey:"AIzaSyCfnHmflYAlp8qwlwLiuTubr0Z995yR8Uc",authDomain:"fexo-hub.firebaseapp.com",projectId:"fexo-hub",storageBucket:"fexo-hub.firebasestorage.app",messagingSenderId:"937734056640",appId:"1:937734056640:web:32329e4054e96a6fc51b25",measurementId:"G-3083DBYQF0"};
firebase.initializeApp(firebaseConfig);
const ADMIN_EMAIL="itzsupan@gmail.com";const SUPPORT_PHONE="01570267525";
const DEFAULT_CONTENT={siteName:"FEXO HUB",eyebrow:"NEXT-GEN STORE",title:"FEXO HUB",text:"Shop, play and enjoy.",sponsorTitle:"Grow your brand with FEXO HUB",sponsorText:"Reach engaged shoppers through sponsored placements.",sponsorLink:"mailto:itzsupan@gmail.com"};
/* ===== GAMES (code diye add korun) =====
   id   : unique, chhoto, space chhara (leaderboard er key hisebe use hoy)
   name : game er nam
   image: cover image path/link (faka rakhle placeholder dekhabe)
   desc : choto description
   url  : game folder er path
   Notun game add korte ei list e ekta line jog korun. */
const GAMES=[
{id:"rickshaw-city",name:"Rickshaw City",image:"",desc:"Drive through the city and score big.",url:"games/rickshaw-city/"},
{id:"tesla-road",name:"Tesla Road",image:"",desc:"Race down the neon road.",url:"games/tesla-road/"}
];
const LB_PAGE_SIZE=20;      // ekbare koyjon load hobe (infinite scroll)
const LB_CYCLE_DAYS=3;      // koyday por leaderboard reset
