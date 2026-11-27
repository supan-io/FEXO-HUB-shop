# FEXO HUB v7

## Games (code diye add korun)
Games ar admin panel theke add hoy na. `config.js` er `GAMES` list e ekta line jog korun (id, name, image, desc, url).

## Game flow
Game Hub -> game card -> Game interface (top e **Play now**, niche leaderboard) -> Play now -> game er alada full page khole.

## Leaderboard
- Prottek game er alada leaderboard, high -> low score, infinite scroll.
- Ek account = ek score (shudhu highest). Score kombe na.
- Proti 3 din por (Bangladesh time) leaderboard auto reset (`LB_CYCLE_DAYS` in config.js; fexo-score.js e `CYCLE_DAYS` o same rakhben).
- Sobai sobar score dekhte pare.

## Game e score system lagano
Prottek game er index.html e `</body>` er age (path thik rekhe):

    <script src="../../fexo-score.js"></script>

Game over hole:

    FexoScore.submit(finalScore);   // shudhu highest save hoy
    FexoScore.exit();               // Game Hub e fire jete (optional)

Game folder er nam = `GAMES` er `id` hote hobe (games/rickshaw-city/ -> id "rickshaw-city").

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
