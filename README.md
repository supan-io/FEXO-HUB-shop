# FEXO HUB v7

## Games (code diye add korun)
Games ar admin panel theke add hoy na. `config.js` er `GAMES` list e ekta line jog korun (id, name, image, desc, url).

## Game flow
Game Hub -> game card -> Game interface (top e **Play now**, niche leaderboard) -> Play now -> game cholbe (fullscreen).

## Leaderboard
- Prottek game er alada leaderboard, high -> low score, infinite scroll.
- Ek account = ek score (shudhu highest). Score kombe na.
- Proti 3 din por (Bangladesh time) leaderboard auto reset (`LB_CYCLE_DAYS` in config.js).
- Sobai sobar score dekhte pare.

## Game theke score pathano
Game over hole game er JS e eita call korun:

    parent.postMessage({type:"fexo-score", score: finalScore}, "*");

Game ke hub er same domain e rakhte hobe (games/rickshaw-city/ etc).

## Firebase rules
`firestore.rules` e eita jog korun, then Publish:

    match /leaderboards/{lb}/scores/{uid} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.uid == uid
                    && request.resource.data.score is number;
      allow update: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.score is number
                    && request.resource.data.score > resource.data.score;
    }

Admin: itzsupan@gmail.com  Support: 01570267525
