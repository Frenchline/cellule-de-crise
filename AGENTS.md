# NÉGOCIATEUR — Cellule de crise

Jeu web solo de négociation de prise d'otage, inspiré des mécaniques de jeux de société de négociation — textes, noms et cartes 100 % originaux. Vanilla HTML/CSS/JS, aucune dépendance, hors-ligne (PWA).

## Commandes

```bash
# Serveur local (depuis la racine du projet)
python3 -m http.server 8080
# → http://localhost:8080

# Tests du moteur (Node 18+ requis)
node --test tests/*.test.js

# Simulation d'équilibrage (bot heuristique)
node tools/simulate.js        # 2000 parties/mission par défaut
node tools/simulate.js 500

# Diagnostic par mission (causes de fin, morts par cause)
node tools/diag.js <missionId> [n]
```

Si `node` n'est pas installé mais qu'un binaire Electron est présent :

```bash
ELECTRON_RUN_AS_NODE=1 /usr/share/devin-desktop/devin-desktop --test tests/*.test.js
ELECTRON_RUN_AS_NODE=1 /usr/share/devin-desktop/devin-desktop tools/simulate.js
```

## Architecture

- `index.html` — écrans (accueil, dossier, QG, briefing, partie, débriefing)
- `css/style.css` — néo-noir + HUD tactique, mobile-first 360px+. En partie, `#scr-game` est `position:fixed` à `height:var(--app-h)` (px réels posés par `main.js` sur `innerHeight`, car `dvh` est peu fiable) et `body.in-game` verrouille le défilement : seul `.transcript` défile, HUD/compteurs/scène en haut, dés/main/onglets en bas. Paliers `max-height` : 700 px (scène 72), 620 px (scène repliée 44 par défaut + cartes 140 + dés 34), 540 px (scène masquée, HUD compact).
- `js/engine.js` — **moteur pur, sans DOM** : état JSON sérialisable, RNG mulberry32 seedé (état dans `state.rngState`). Phases : `conversation` → `market` → `team` → résolution Terreur → nouveau tour.
- `js/ui.js` — rendu DOM (HUD, transcription avec machine à écrire, dés, marché, onglets, modale carte)
- `js/main.js` — navigation entre écrans, sauvegarde, chrono, tutoriel, vignettes d'événements, boucle d'animation du bandeau scène
- `js/pixel.js` — **moteur de sprites pixel-art 100 % procédural** (aucun fichier image) : `portraitSprite(spec, expression)`, `sceneSprite(id, frame, nbOtages)`, `vignetteSprite(kind)`, `avatarSprite(spec)`. Sprite = `{ w, h, rows: [string], palette: {char: couleur} }` rendu sur canvas `image-rendering: pixelated`. Expressions : `calme`, `tendu`, `furieux`, `abattu`, `parle`. Les primitives de dessin (`G`, `px`, `rect`, `hl`, `vl`, `sprite`, `drawText`, `vigFigure`) sont exportées.
- `js/pixelcut.js` — arts des cinématiques 160×120 animés par frame : `cutSprite(artId, frame)`, liste `CUT_ARTS`. Chaque art a au moins un élément animé (pluie, néon, gyro, ECG, faisceau, flash).
- `js/data/cutscenes.js` — cinématiques déclaratives par mission (`tutoriel`, `braquage`, `hopital`) : `intro` (jouée avant le briefing quand « Illustrations » est on) et `mid` (déclencheurs `{ turn }`, `{ threatGte }`, `{ pressureGte }`, `{ freed }`, `{ death }`, une fois chacune via `game.cutsSeen`, persisté par la sauvegarde JSON). `pickCutscene(game, seen)` est pur ; sous `brouillard`, `threatGte` est ignoré ; jamais si `game.result` ou `phase === 'choice'`. Affichage : `#cut-overlay` (z 73, sous la modale Règles), machine à écrire, tap = finir ligne → ligne → panneau → fin, « Passer ▶▶ ». Le chrono ne tourne pas et la file de vignettes attend pendant une cinématique.
- `js/audio.js` — 100 % Web Audio généré (aucun fichier). Séquenceur lookahead (~25 ms) : `AU.setMusic('menu'|'cinematique'|'game'|null)`, `AU.setTension({ threat, deckLeft, fog, chronoLeft, over, cut })`, `tensionLevel(threat, fog)` → `calme|tendu|danger|panique` (brouillard → `tendu`). Bascule à la barre suivante, courte fondu. `MUSIC_VOL = 1` : les niveaux des voix sont absolus (lead 0.05 square lp 2000, basse 0.09 triangle **transposée +12** sinon inaudible sur téléphone, pad 0.018/osc, hats 0.03, caisse 0.06). Battement de cœur audible dès menace 4 (fixe modéré sous brouillard), sine 70→40 + partiel triangle 110→80 pour les petits haut-parleurs. Tic-tac continu pendant la partie (mode `game`, pas de résultat, `cut` faux pendant une cinématique) : 1/s doux (~0.06), ~0.12 quand la pioche Terreur ≤ 4, 2/s et ~0.16 à ≤2 ou chrono ≤10 s. Ambiance = drone grave seul (pas de pluie plein écran ; la pluie n'existe que dessinée dans les arts pixel). Activation de la musique partout via `settings.music !== false` (joueurs de retour sans la clé → musique on). Réglage `music` persisté (case « Musique » au QG).
- Teinte de menace : `#threat-tint` (z 30, pointer-events none) piloté par `body[data-tt]` — ambre à 3-4, rouge pulsant à 5-7 (+ désaturation à 7), flash rouge à la montée (réglage `flash`), rien sous `brouillard`, retiré hors écran de jeu.
- `js/campaign.js` — campagne localStorage (rangs, XP, stress, compétences, sauvegarde de partie). Réglages : `DEFAULT_SETTINGS` unique, `loadSettings()` = `{...DEFAULT_SETTINGS, ...sauvegardé}` — une clé absente d'une ancienne sauvegarde (ex. `music`) hérite du défaut.
- `js/data/` — cartes, Terreur, compétences, options, missions (données déclaratives)

## Données de mission (pour ajouter un scénario)

Créer `js/data/missions/<id>.js` exportant un objet :

```js
{
  id, title, subtitle, type: 'classic'|'tutorial'|'advanced',
  startThreat, hostages, terrorDeck: [ids], market: [ids],
  demands: [{ id, label, major, detail, concede: { effects, text } }],
  clues: [{ id, name, desc, trait: { tagMods }, famille?, proche? }],
  terrorExtra: { id: { id, name, text, taker, effect } },
  briefing: [...], epilogues: { surrender, liberation, assault, escape, defeat },
  taker: { name, age, dossier: [...], responses: { byTag, byCard, default }, lines,
           portrait: { skin, hair, hairColor, beard, glasses, clothes, accessory, age } },
  scene,                  // id de scène pixel-art : pharmacie, banque, hopital, ferme, prison, ferry
  tutorial?, noKillBeforeTurn?, terrorOrdered?,
}
```

Puis l'enregistrer dans `js/data/missions/index.js` et ajouter sa carte Terreur / marché si besoin.

## Missions avancées multi-actes (`type: 'advanced'`)

Une mission avancée remplace `terrorDeck` par `acts` (la pioche Terreur devient celle de l'acte courant) :

```js
{
  pressureEvery: N,      // pression médiatique +1 tous les N tours seulement (défaut 1)
  counters: [{
    id, label, icon, start, max, resetTo, cause,
    onMax: effets,        // appliqués quand le compteur atteint max, puis valeur = resetTo
  }],
  choices: {
    id: { prompt, options: [{ label, desc, effects, flag? }] },
  },
  extraTeamActions: [{ id, name, desc, log, effects }],   // actions d'équipe de scénario
  teamOverrides: { supply: { extraEffects } },            // effets ajoutés à une action standard
  assaultRiskFlags: { flagId: +risque },                  // modifie le risque d'assaut si flag posé
  acts: [{
    id, title, intro: [paragraphes],
    terrorDeck: [ids],   // pioche de l'acte ; vide → acte suivant (Heure H seulement au DERNIER acte)
    startThreat?,        // fixe la menace à l'entrée (sinon conservée)
    taker?,              // remplace l'interlocuteur ; peut être { ifFlag, then, else }
    addDemands?, addClues?, addMarket?,   // appendus à l'entrée de l'acte
    choice?,             // id d'un choix déclenché à l'entrée
    onEnter?, eachTurn?, // effets à l'entrée / au début de chaque tour de l'acte
    goal?,               // [{ type, ... }] : 'freed'{n}, 'demand'{id}, 'clue'{id}, 'counterLte'{id,v}
    scene?,              // variante de scène pixel-art pour l'acte (ex. ferme_aube, prison_feu, ferry_mer)
  }],
}
```

Règles associées :
- Atteindre le `goal` d'un acte non final → transition ; au dernier acte → Heure H. Pioche vide d'un acte non final → transition ; du dernier → Heure H.
- `proposer_reddition` n'est jouable qu'au dernier acte (l'interlocuteur précédent n'a pas le pouvoir de se rendre).
- Mort du dernier otage → **défaite** pour les missions `acts`, même si des otages ont été libérés avant. Pour les missions classiques : libération seulement si `freed ≥ killed`, sinon défaite.
- Un choix verrouille `state.phase = 'choice'` + `state.pendingChoice` ; `chooseOption(state, i)` applique effets/flag et reprend. Sérialisable.
- `getTaker(state)` résout l'interlocuteur courant (acte + flag) — ne jamais lire `mission.taker` directement. `getDemandDef`/`getClueDef` cherchent aussi dans les ajouts d'actes.
- `state.deaths` trace chaque mort `{ turn, cause, n }` (via `recordDeaths`) → section « BILAN HUMAIN » du débrief + ligne ✝ du score.

## Descripteurs d'effets (engine.js)

`threat`, `pressure`, `pc`, `pcNext`, `free`, `kill`, `reveal`, `prep`, `discardNextTerror`, `win:'surrender'`, `neutralizeDemand`, `concedeDemand`, `mark:'promesse'`, `flag:'complice'`, `counter: { id: delta }`, `choice: 'id'`, `assault`, `lose`, `log`, plus conditionnels `ifThreatGte`, `ifFlag`, `ifCounterGte`, `ifClue`, `roll` (tables `0/1/2/3+`), `demandMajorPending`, `promise`.

## Hooks de débogage (`?debug` requis)

`/?debug#auto:hq` (avancés verrouillés), `#auto:hq:unlocked` (campagne mémoire pré-remplie), `#auto:brief:<id>`, `#auto:game:<id>[:<pas>]` (joue N phases, choix → option 0), `#auto:choice:<id>` (joue jusqu'au premier choix), `#auto:debrief:<id>` (débrief forcé), `#auto:vig:<kind>` (affiche une vignette : terror, freed, death, assault, surrender, heureh, acte, clue), `#auto:tuto:<n>` (tutoriel à l'étape n), `#auto:gallery` (galerie de relecture : tous les portraits × expressions, scènes et variantes, vignettes), `#auto:tutocheck` (vérifie chaque étape du tutoriel via `elementFromPoint` + vrais `click()` DOM, rapport JSON dans `<pre id="tutocheck">`), `#auto:cut:<missionId>:<intro|cléMid>[:<panneau>]` (cinématique figée pour capture), `#auto:cutgallery` (tous les arts 160×120 aux frames 0 et 3), `#auto:layout:<id>:<pas>` (joue N phases puis mesure : `scrollHeight <= innerHeight`, onglets dans l'écran, hauteur transcript → `<pre id="layoutcheck">`), `#auto:chronocheck` (option Chrono : décompte t1, relance au tour suivant, timeout → menace +1, pause pendant une cinématique, relance après choix en mission avancée → `<pre id="chronocheck">`). En mode auto aucune écriture localStorage.

Pour les captures à taille mobile exacte : `tests/vp.html?w=390&h=844&src=/<url-encodée>` charge l'app dans une iframe de la dimension voulue (le viewport headless direct est borné à ~500px de large). `tests/audiocheck.html` vérifie le séquenceur/pistes/tension sans exception en headless (`--autoplay-policy=no-user-gesture-required`, rapport dans `<pre id="audiocheck">`). Avec `?levels` il mesure les niveaux réels (AnalyserNode sur le bus maître, pic/RMS en dBFS pour chaque piste de tension + tic + battement, en simulant un joueur de retour sans clé `music`) — nécessite `python3 tools/audiowait.py` (port 8099) qui retarde le `load` ~16 s pour laisser tourner l'audio en temps réel :

```bash
python3 tools/audiowait.py &
google-chrome --headless=new --autoplay-policy=no-user-gesture-required \
  --dump-dom "http://localhost:8080/tests/audiocheck.html?levels"
```

## Tests

`tests/engine.test.js` couvre : modificateur de dés, tables d'effets, conditions, point de rupture, pression 10 → assaut, Heure H, assaut, victoires/défaites, concessions, indices/traits, compétences, options, marché, sérialisation, jets favorisés du tutoriel, morts (`state.deaths`, bilan ✝), actes (transition pioche/objectif, Heure H au dernier acte), choix (verrou, flag, sérialisation), compteurs (onMax/resetTo), `eachTurn`, `extraTeamActions`, `teamOverrides`, `assaultRiskFlags`, taker conditionnel, `getDemandDef` sur demandes ajoutées. `tests/campaign.test.js` couvre la persistance (localStorage mocké) et le déblocage des missions avancées. `tests/ui.test.js` couvre `shortEffects` (simples, auto, roll, ifThreatGte, compteurs), `cardTierLines`, et la composition pixel-art (dimensions, palettes sans caractère inconnu, les 5 expressions pour chaque interlocuteur de chaque mission, variation des frames animées). `tests/cutscenes.test.js` couvre les arts de cinématiques (160×120, validateSprite, frame 0 ≠ frame 3, référencement dans CUT_ARTS), `pickCutscene` (tour, threatGte ignoré sous brouillard, result/choice, freed/death/pressureGte, une seule fois) et `tensionLevel`.
