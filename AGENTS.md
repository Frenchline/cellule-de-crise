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
- `js/cutscene.js` — joueur d'overlay des cinématiques (machine à écrire, tap pour avancer, « Passer ▶▶ », cinématiques de milieu de partie) ; dépendances injectées par `initCutscene()` depuis main.js — aucun import de main.js
- `js/debug.js` — harnais de test/capture `?debug#auto:…` (chargé par `import()` dynamique uniquement en mode debug ; `saveEnabled = false` posé par main.js avant l'appel, tout accès à l'état via l'`api` injecté — aucun import de main.js)
- `js/pixel.js` — **moteur de sprites pixel-art 100 % procédural** (aucun fichier image) : `portraitSprite(spec, expression)`, `sceneSprite(id, frame, nbOtages)`, `vignetteSprite(kind)`, `avatarSprite(spec)`. Sprite = `{ w, h, rows: [string], palette: {char: couleur} }` rendu sur canvas `image-rendering: pixelated`. Expressions : `calme`, `tendu`, `furieux`, `abattu`, `parle`. Les primitives de dessin (`G`, `px`, `rect`, `hl`, `vl`, `sprite`, `drawText`, `vigFigure`) sont exportées.
- `js/pixelcut.js` — arts des cinématiques 160×120 animés par frame : `cutSprite(artId, frame)`, liste `CUT_ARTS`. Chaque art a au moins un élément animé (pluie, néon, gyro, ECG, faisceau, flash).
- `js/data/cutscenes.js` — cinématiques déclaratives pour les 6 missions écrites : `intro` (3 panneaux, jouée avant le briefing quand « Illustrations » est on) et `mid` (une fois chacune via `game.cutsSeen`, persisté par la sauvegarde JSON). Déclencheurs — **toutes les conditions doivent être vraies (ET)** : `{ turn }`, `{ threatGte }` (ignoré sous `brouillard`), `{ pressureGte }`, `{ counterGte: { id, v } }` (compteurs rituel/emeute/explosifs), `{ act: n }` (indice 0-based), `{ actTurn: n }` (n-ième tour de l'acte, s'appuie sur `state.actStartTurn` posé par `transitionAct`), `{ freed }`, `{ death }`. `pickCutscene(game, seen)` est pur ; jamais si `game.result` ou `phase === 'choice'`. Affichage : `#cut-overlay` (z 73, sous la modale Règles), machine à écrire, tap = finir ligne → ligne → panneau → fin, « Passer ▶▶ ». Le chrono ne tourne pas et la file de vignettes attend pendant une cinématique.
- `js/audio.js` — 100 % Web Audio généré (aucun fichier), **sans musique** : design sonore calibré téléphone (~150 Hz–3 kHz, pas de couche purement sub-grave). `AU.setAmbience('menu'|'cinematique'|'game'|null)`, `AU.setTension({ threat, deckLeft, fog, chronoLeft, over, cut })`. **Nappe de tension** (partie) : 3 voix désaccordées ~A2–E3 dans un passe-bas (coupure ~300 → 1800 Hz selon la menace, LFO lent « respiration ») ; voix dissonante seconde mineure à ≥ 6, trémolo à 7 ; transitions ~1,5 s ; sous brouillard niveau médian fixe. En menu/cinématique la même nappe tourne coupure basse, plus douce ; `AU.swell()` gonfle brièvement au changement de panneau. **Radio cellule** : toutes les ~18–45 s (plus souvent menace ≥ 5) un burst 1–2,5 s — squelch + bruit passe-bande ~900–2500 Hz découpé en « syllabes » 4–9 Hz. Stingers : `playThreatUp()` (boom 80→50 + corps 200–400 + claquement), `playThreatDown()` (deux notes descendantes), `playDeathTone()` (bourdon dissonant ~3 s après le coup de feu) ; main.js les déclenche aux variations de menace (jamais sous brouillard, pas de threatUp si une mort vient de se produire). **Tic-tac** seulement quand la pioche Terreur ≤ 4 (1/s ~0.12) ou ≤ 2 / chrono ≤ 10 s (2/s ~0.16), muet hors jeu/résultat/cinématique. Sirène lointaine occasionnelle + SFX existants. Bus `ambGain` (nappe + radio) gouverné par `settings.music !== false` (clé `music`, case « Ambiance sonore ») ; SFX/stingers/tic-tac suivent le mute général seul.
- `js/advice.js` — conseils de la psychologue, module pur : `adviceFor(state, seen)` → `{key, text} | null` par priorité (rupture ≥ 6 — jamais sous brouillard, presse ≥ 8, demande majeure, indice tagMods `trait_<id>`, horloge pioche ≤ 3, **otage fragile `vulnerable_<id>`**, indices + Écoute en main, ouverture tour 1). `engine.addAdvice(state)` journalise une entrée `psy` (persistée par la sauvegarde) et trace `state.adviceSeen[clé] = tour` (répétition ≥ 3 tours). main.js l'appelle en début de chaque phase de conversation si le réglage `advice` est on (case « Conseils de la psy »). Affichage : `tl-psy` sarcelle + avatar `PIX.PSY_PORTRAIT`.
- **Otages nommés** (`state.hostageList`) : chaque mission déclare `hostageList: [{id, name, role, trait?, f?}]` de longueur `hostages` ; `trait` = `vulnerable` | `heros`, `f` = accord féminin. `createGame` construit `state.hostageList` (`status: held|freed|dead`, `turn`, `cause`) ; `ensureHostageList(state)` (exporté) reconstruit paresseusement sur anciennes sauvegardes (les `freed` premiers dans la liste, puis les `killed`). Les pickers sont **déterministes sans RNG** : libérés → premier `vulnerable` retenu sinon ordre de liste ; tués → `heros` d'abord sinon `held[(tour×7 + tués×3) % n]` (`recordDeaths`/`freeHostages` acceptent `{ids:[…]}` pour forcer). Journal nominatif 🚪/✝ avec accords. Option `blesse` : l'otage blessé = premier vulnérable (`flags.woundedId`), mort nommée au délai. **Événement héros** (dans `startTurn`, une fois par partie via `flags.herosDone`, menace ≥ 5 et tour ≥ 3) : 1d6 → 1 tué (cause « Tentative de … »), 2-4 menace +1, 5-6 il s'échappe (compté libéré). Invariant testé : compteurs == statuts. UI : onglet Dossier section Otages (badges fragile/imprévisible ; clic sur le HUD OTAGES y saute), débrief BILAN HUMAIN nominatif.
- Probabilités de paliers (`engine.js`) : `tierOdds(pool, keys)` = binomiale exacte p=1/3 (chaque palier couvre `[clé, cléSuivante)`, max = « k+ ») ; `cardOdds(state, card)` (auto → null, `riggedRolls` → palier haut 100 %) affichées en % sur les cartes (`cardTierLines` → `[étiquette, %, texte]`, main + marché + modale) ; `failRisk(state, card)` → `'kill'|'assault'|null` si le palier d'échec mène menace → 7 ou presse → 10 → ligne rouge ⚠ sur la carte et confirmation à deux taps dans la modale quand l'échec ≥ 25 %.
- Teinte de menace : `#threat-tint` (z 30, pointer-events none) piloté par `body[data-tt]` — ambre à 3-4, rouge pulsant à 5-7 (+ désaturation à 7), flash rouge à la montée (réglage `flash`), rien sous `brouillard`, retiré hors écran de jeu.
- `js/campaign.js` — campagne localStorage (rangs, XP, stress, compétences, sauvegarde de partie). Réglages : `DEFAULT_SETTINGS` unique, `loadSettings()` = `{...DEFAULT_SETTINGS, ...sauvegardé}` — une clé absente d'une ancienne sauvegarde (ex. `music`) hérite du défaut. `loadCampaign()` fusionne aussi `rep` avec les défauts (migration).
- **Réputation** (`js/reputation.js`, module pur) : `campaign.rep = { presse, hierarchie }` 0–10, défaut 5. `repDeltas(outcome, state)` → deltas bornés [−2,+2] (presse : pression finale, concessions majeures, reddition, morts ; hiérarchie : issue, concessions, assaut volontaire propre). `CAM.applyReputation(c, missionId, game)` applique après chaque mission (sauf tutoriel), garde les répliques dans `c.repLast` et rend le rapport pour la section « RÉACTIONS » du débrief (Castagne/Morvan/Dr Anselme, portraits `REP_CHARS`). Modificateurs de départ via `repModifiers(rep)` et l'option `rep` de `createGame` : presse ≥ 8 → `flags.mediaGrace = 2` (2 ticks de pression automatiques sautés) ; presse ≤ 2 → pression de départ +2 ; hiérarchie ≥ 8 → préparation +1 ; hiérarchie ≤ 2 → `state.assaultAt = 9` (au lieu de 10 — seuil lu par `changePressure`, `failRisk`, le conseil psy, l'avertissement ⚠ carte et les règles). Contextes affichés en « Contexte » au briefing ; jauges + remarques au QG (bloc Relations).
- **Lot 5 — mécaniques** : `teamRoll(state, label)` (1d6 seedé, journal `dice` « ⚙ ÉQUIPE — … ») gouverne les actions d'équipe renseignement/tireur/ravitaillement : sur 1 l'action échoue (coût payé, effet perdu — tireur repéré : menace +1 ; les `teamOverrides` sont sautés en cas d'échec). **Épreuve du feu** (`flags.teamSlip`, compteur) : les deux premiers 1 de la mission sont couverts par la cellule — adoucissement d'équilibrage (sim 2000 parties : `captures/sim-lot5.txt`). Compétence `discipline` : un 1 non couvert est relancé une fois (« rattrapé »). **Promesse** (`flags.promise` + `flags.promiseTurn`) : au premier début de tour où `turn − promiseTurn ≥ 3`, jet 1d6 — 1-2 → il a compris le mensonge (menace +1, ligne taker + note sys), sinon la marque expire avec « tient encore… ». **Exfiltration ciblée** (`liberation_ciblee`, marché, toutes missions + pool généré) : effet `pickFree: n` → `phase:'choice'`, `pendingChoice = { hostagePick: n, resume }` — le joueur choisit l'otage retenu (`chooseOption` libère par `ids`, `resume:'endTerror'` → `postTerror`, sinon `conversation`). `state.threatMax` suit le pic de menace (trophée).
- **Lot 5 — campagne** : `js/trophies.js` (pur) — 12 trophées `{id,name,desc}` vérifiés dans `recordResult` (ctx : `missionId, outcome, win, state, scoreInfo, repAfter` ; `repAfterMission()` projette les jauges) ; `c.trophies`, `c.stats.savedTotal`, `c.dailyStreak` (maj dans `recordDaily(c,…,date)`), débrief « 🏅 Trophée débloqué », grille QG (verrouillés grisés). `js/data/story.js` — `appendStoryLog` (1-2 lignes par mission/issue dans `c.storyLog`, cap 20, portraits `STORY_CHARS` = Castagne/Morvan/Dr Anselme), `updateStoryFlags` (`story.complice` ← braquage gagné → contexte + question `q_rhodanien` en prison via `flags.storyComplice` ; `story.levant` ← ferry), `storyContexts` injecté dans le briefing. **Export/import** : `CAM.exportSave(c)` → base64url de `{v:1, campaign}` ; `CAM.importSave(code)` valide et fusionne les défauts (jette « Code invalide ») ; modale `#io-modal` (`UI.openIOModal`, copie `navigator.clipboard` + repli `execCommand`). Compétences à coût (`s.cost` pts de compétence) : `lecture_froide` (2 — badge « cohérent » sans indice à la 1re question), `relations` (1 — jauges planchées à 6 dans `repModifiers`/`repEffective` et `createGame`), `nerfs_acier` (2 — chrono 75 s via `flags.chronoBase`, lu par `main.js`), `discipline` (2 — relance d'équipe).
- **Déroulé** : `state.history = [{ turn, threat, pressure, held }]` alimenté à chaque début de tour (`startTurn`), en `createGame` et en `endGame` ; les entrées du journal portent `turn`. Débrief « DÉROULÉ » : `drawTimeline(canvas, state)` (menace rouge 1–7, presse ambre 0–10, pointillés de changement d'acte, icônes d'événements) + `keyMoments(log)` (pur, ≤ 12 entrées : ✝ 🚪 ⚔ ◆ 🔍 ❓ ⚑ § par priorité).
- `js/data/` — cartes, Terreur, compétences, options, missions (données déclaratives)

## Données de mission (pour ajouter un scénario)

Créer `js/data/missions/<id>.js` exportant un objet :

```js
{
  id, title, subtitle, type: 'classic'|'tutorial'|'advanced',
  startThreat, hostages, terrorDeck: [ids], market: [ids],
  demands: [{ id, label, major, detail, concede: { effects, text } }],
  clues: [{ id, name, desc, trait: { tagMods }, famille?, proche? }],
  hostageList: [{ id, name, role, trait?, f? }],   // longueur == hostages
                                                  // trait: 'vulnerable'|'heros' ; f: accord féminin
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

## Questions du preneur (`mission.questions`)

Le preneur peut poser une question au fil de la négociation ; le joueur choisit une réponse parmi trois. Réutilise le mécanisme de choix (`phase: 'choice'`, `state.pendingChoice = { questionId }`, `chooseOption`) :

```js
questions: [{
  id, minTurn,            // posée en début de tour, turn ≥ minTurn
  act?,                   // restreinte à un acte (missions multi-actes)
  flag?,                  // n'est posée que si state.flags[flag] est vrai
  text,                   // la question du preneur (bulle)
  speaker?,               // optionnel
  replies: [{ label, tag, answer, effects, line? }],
  // tag: 'empathie'|'autorite'|'pression'|'ruse' → chip de ton
  // answer: sa réplique, journalisée après le choix ; line: ligne joueur (défaut label)
}]
```

- `maybeQuestion(state)` (exporté) est appelé en fin de `startTurn` : ordre des données, aucun RNG ; chaque question une fois (`state.questionsAsked`), ≥ 2 tours entre questions (`state.lastQuestionTurn`), jamais si `result`/`pendingChoice`, jamais le tour qui suit une transition d'acte (`startTurn(state, freshAct)` — y compris la reprise après un choix d'acte).
- `getChoice` renvoie pour une question `{ question, prompt, options: replies }` ; `chooseOption` journalise la ligne joueur (`player`), sa réplique (`taker`) et un résumé d'effet (`sys`), résout `ifClue` selon l'indice révélé ou non, puis revient en `conversation`.
- `replyCoherent(state, reply)` (exporté) → vrai si `ifClue` sur indice révélé avec branche `then` bénéfique → badge vert « ✓ cohérent avec son profil » dans la modale (variante `.ch-dialog` : portrait + bulle + chips de ton, `.tag-<tag>`/`.co-badge` dans style.css). Le chrono ne tourne pas (phase ≠ `conversation`).

## Missions générées — « Opérations spéciales »

`js/data/generator.js` : `generateMission(seed)` → mission au format classique complet (id `gen:<seed>`). RNG propre (`mulberry32(seed ^ 0x5EED)`) — jamais `state.rngState`. Six archétypes (`ARCHETYPES`) avec leurs demandes, indices, réponses par tag, répliques et questions propres : père désespéré (`pere`), ancien militaire (`militaire`), conjoint jaloux (`jaloux`), usager en manque (`toxico`), employé licencié (`licencie`), jeune qui doute (`doute`). Scènes `pharmacie|banque|hopital` associées à des lieux français (`VENUES`) ; 4–6 otages nommés (1 `vulnerable`, parfois 1 `heros`), Terreur 12 ids du pool générique, marché 10 ids existants, 2–3 demandes (≥1 majeure), 5 indices (ceux cités par les questions garantis), 2 questions, 5 épilogues, portrait valide.

`getMission(id)` (missions/index.js) résout `gen:<seed>` par génération mémoïsée (cache 20) → création, sauvegarde/reprise et simulation passent par le chemin normal. Pas de cinématique (`getIntro` → null).

QG, section **Opérations spéciales** (visible une fois le tutoriel gagné) :
- **Mission du jour** — seed = `dailySeed()` = AAAAMMJJ locale (même mission pour tous). Premier résultat du jour → `campaign.daily = { date, grade, score, saved, total }` via `CAM.recordDaily` ; les replays n'écrasent pas. Bouton « Partager » : `navigator.share` sinon presse-papiers (`shareDailyResult` dans main.js).
- **Mission aléatoire** — seed tiré au hasard ; « 🎲 Autre mission » (`#btn-brief-reroll`, visible pour tout `gen:`) relance le briefing.
- XP/stress comme en mission classique, mais `recordResult` n'écrit **pas** `c.missions['gen:…']` (`isGeneratedMission`) — évite la croissance localStorage ; seul `campaign.daily` persiste.

## Descripteurs d'effets (engine.js)

`threat`, `pressure`, `pc`, `pcNext`, `free`, `kill`, `reveal`, `prep`, `discardNextTerror`, `win:'surrender'`, `neutralizeDemand`, `concedeDemand`, `mark:'promesse'`, `flag:'complice'`, `counter: { id: delta }`, `choice: 'id'`, `assault`, `lose`, `log`, plus conditionnels `ifThreatGte`, `ifFlag`, `ifCounterGte`, `ifClue`, `roll` (tables `0/1/2/3+`), `demandMajorPending`, `promise`.

## Hooks de débogage (`?debug` requis)

`/?debug#auto:hq` (avancés verrouillés), `#auto:hq:unlocked` (campagne mémoire pré-remplie, section Opérations spéciales visible), `#auto:brief:<id>` (accepte `gen:<seed>`), `#auto:game:<id>[:<pas>]` (joue N phases, choix → option 0 ; accepte `gen:<seed>`), `#auto:question:<id>[:<qid>]` (force la prochaine question du preneur — ou celle nommée —, révèle l'indice lié pour le badge ✓, laisse la modale ouverte pour capture), `#auto:choice:<id>` (joue jusqu'au premier choix), `#auto:debrief:<id>` (débrief forcé), `#auto:vig:<kind>` (affiche une vignette : terror, freed, death, assault, surrender, heureh, acte, clue), `#auto:tuto:<n>` (tutoriel à l'étape n), `#auto:gallery` (galerie de relecture : tous les portraits × expressions, scènes et variantes, vignettes), `#auto:tutocheck` (vérifie chaque étape du tutoriel via `elementFromPoint` + vrais `click()` DOM, rapport JSON dans `<pre id="tutocheck">`), `#auto:cut:<missionId>:<intro|cléMid>[:<panneau>]` (cinématique figée pour capture), `#auto:cutgallery` (tous les arts 160×120 aux frames 0 et 3), `#auto:layout:<id>:<pas>` (joue N phases puis mesure : `scrollHeight <= innerHeight`, onglets dans l'écran, hauteur transcript → `<pre id="layoutcheck">`), `#auto:chronocheck` (option Chrono : décompte t1, relance au tour suivant, timeout → menace +1, pause pendant une cinématique, relance après choix en mission avancée → `<pre id="chronocheck">`), `#auto:psy:<id>` (menace forcée à 6 : entrée « psy », % des cartes et ⚠ visibles pour capture), `#auto:tabs:<id>:<equipe|dossier>` (phase d'équipe + onglet ouvert). Préfixe `rep:<p>:<h>:` devant n'importe quel mode → fixe `campaign.rep` (ex. `#auto:rep:9:2:hq:unlocked`, `#auto:rep:9:2:brief:braquage`). Les hooks `game:`/`layout:`/`tabs:`/`question:`/`debrief:` décodent les ids `gen:<seed>` (le `:` interne) via `splitId`. En mode auto aucune écriture localStorage.

Pour les captures à taille mobile exacte : `tests/vp.html?w=390&h=844&src=/<url-encodée>` charge l'app dans une iframe de la dimension voulue (le viewport headless direct est borné à ~500px de large) ; `&wait=N` retarde le `load` via `tools/audiowait.py` pour laisser finir les vérifications en temps réel (tutocheck) avant `--dump-dom`. `tests/audiocheck.html` vérifie nappes/tension/radio/stingers sans exception en headless (`--autoplay-policy=no-user-gesture-required`, rapport dans `<pre id="audiocheck">`). Avec `?levels` il mesure les niveaux réels (AnalyserNode sur le bus maître, pic/RMS en dBFS : nappe @ menace 1/4/7, burst radio, threatUp, tic-tac — en simulant un joueur de retour sans clé `music`) — nécessite `python3 tools/audiowait.py` (port 8099) qui retarde le `load` pour laisser tourner l'audio en temps réel :

```bash
python3 tools/audiowait.py &
google-chrome --headless=new --autoplay-policy=no-user-gesture-required \
  --dump-dom "http://localhost:8080/tests/audiocheck.html?levels"
```

## Tests

`tests/engine.test.js` couvre : modificateur de dés, tables d'effets, conditions, point de rupture, pression 10 → assaut, Heure H, assaut, victoires/défaites, concessions, indices/traits, compétences, options, marché, sérialisation, jets favorisés du tutoriel, morts (`state.deaths`, bilan ✝), actes (transition pioche/objectif, Heure H au dernier acte), choix (verrou, flag, sérialisation), compteurs (onMax/resetTo), `eachTurn`, `extraTeamActions`, `teamOverrides`, `assaultRiskFlags`, taker conditionnel, `getDemandDef` sur demandes ajoutées. `tests/campaign.test.js` couvre la persistance (localStorage mocké) et le déblocage des missions avancées. `tests/ui.test.js` couvre `shortEffects` (simples, auto, roll, ifThreatGte, compteurs), `cardTierLines`, et la composition pixel-art (dimensions, palettes sans caractère inconnu, les 5 expressions pour chaque interlocuteur de chaque mission, variation des frames animées). `tests/cutscenes.test.js` couvre les arts de cinématiques (160×120, validateSprite, frame 0 ≠ frame 3, référencement dans CUT_ARTS), `pickCutscene` (tour, threatGte ignoré sous brouillard, result/choice, freed/death/pressureGte, une seule fois) et `tensionLevel`. `tests/hostages.test.js` couvre les otages nommés (listes conformes aux briefings, pickers déterministes sans RNG, blessé nommé, événement héros unique et conditionné, `ensureHostageList` sur ancienne sauvegarde, conseil `vulnerable_<id>`, invariant compteurs == statuts sur 200 parties simulées par mission). `tests/questions.test.js` couvre les questions du preneur (forme des données sur les 6 missions, ifClue vers indices existants, déclenchement minTurn/unicité/espacement ≥ 2 tours, act et flag gating, `replyCoherent`, journal joueur/taker, sérialisation). `tests/generator.test.js` couvre les missions générées (déterminisme profond, variété, `getMission('gen:<seed>')` mémoïsée, validité complète sur 300 seeds — références Terreur/marché, hostageList, portrait, 5 épilogues, ≥1 majeure — et 300 parties simulées complètes avec invariant compteurs == statuts).

`tools/simulate.js` ajoute en fin de rapport un bloc « Missions générées » : 50 seeds fixes × 10 parties (500), taux agrégés. Son `pickChoice` résout les `ifClue` d'après l'état (indice révélé → branche `then`) et score `pc/pcNext/free/mark` — ne s'applique qu'aux réponses de questions (aucun choix d'acte n'utilise ces clés). `tests/lot5.test.js` couvre le lot 5 : échecs d'équipe sur 1 (jets forés via `rngState` calculé), épreuve du feu et discipline, promesse (délai 3 tours, découverte, expiration), exfiltration ciblée (modale + libération par `ids`), journal narratif et drapeau `story.complice`, les 12 trophées en cas limites (dont `serie7` sur dates simulées via `recordDaily(..., date)`), les 4 compétences, export/import aller-retour et rejets, migration d'ancienne campagne, `threatMax`.
