# Conversation Tree — Arbre de conversation IA

Extension navigateur (Chrome / Edge, Manifest V3) qui affiche **l'arbre et le fil de votre conversation** avec une IA conversationnelle : les grands titres, les sous-titres et les échanges issus des réponses de l'IA. Un clic sur une entrée vous **redirige instantanément** (scroll doux + surlignage) à l'endroit correspondant dans le chat — fini les longues conversations où l'on se perd.

Compatible : **Claude (claude.ai/claude.com), Gemini (gemini.google.com), Kimi (kimi.com), Perplexity (perplexity.ai), Copilot (copilot.microsoft.com), Grok (grok.com)** et une **détection générique** pour la plupart des autres IA de chat.

## Installation (mode développeur)

1. Ouvrir `chrome://extensions` (ou `edge://extensions`).
2. Activer **Mode développeur** (en haut à droite).
3. Cliquer **Charger l'extension non empaquetée**.
4. Sélectionner le dossier `D:\pluging_IA`.

Un bouton flottant (icône du fil de conversation) apparaît en bas à droite sur les sites de chat reconnus. Cliquez pour ouvrir/fermer le panneau, cliquez sur un message ou un sous-titre pour y sauter.

## Fonctionnement

- **Analyse DOM** des réponses rendues par l'IA (aucune interception réseau, aucun envoi de données).
- **Chaque message utilisateur est un dossier** intitulé « Vous avez dit : ... » ; un clic le déplie, un **double-clic** y fait défiler. Sous le dossier, un séparateur « **X a répondu :** » introduit le fil des réponses IA, imbriqué selon les titres et sous-titres (`h1`–`h6` ou [`role="heading"`]), même en profondeur.
- **Historique complet mémorisé** : les messages vus restent affichés même si le site décharge/ne rend qu'une partie du thread (virtualisation) — plus besoin de parcourir la conversation pour voir le début.
- **Mise à jour en continu** : MutationObserver + debounce (150 ms), intervalle de rafraîchissement (1,5 s) et re-détection sur navigation SPA qui apparaissent dès que la conversation est chargée.
- **Clic sur un sous-titre** → `scrollIntoView` doux + flash de surlignage temporaire. Appui sur `Échap` pour fermer le panneau. Le bouton « Début de conversation » remonte au tout premier message.

## Réglages

Accessibles via **`…`** dans le panneau (fenêtre de réglages intégrée, pas d'onglet externe) :

- Activer/désactiver chaque plateforme (Claude, Gemini, Kimi, Perplexity, Copilot, Grok, générique).
- **Niveau de titre minimum** (ex. `h2` pour n'afficher que les grosses sections).

Extension : les réglages sont aussi éditables depuis l'icône de l'extension → **Conversation Tree — Réglages**.

## Structure du projet

```
manifest.json      Manifest V3 (content scripts + storage + options + icônes)
icons/             Icônes (16/32/48/128 px) : le « fil en zig-zag » — perles-messages sur un
                   long fil de conversation, spur de sous-titres, perle-cible dorée
scripts/           Script PS de génération des icônes (System.Drawing, reproductible)
                   → `pwsh -NoProfile scripts/generate-icons.ps1`
src/core.js        Utils : debounce, throttle, scroll doux, flash, snippets de texte
src/adapters.js    Détection de plateforme + extraction DOM (messages et titres)
src/runtime.js     Bootstrap partagé extension/wrapper (settings, observers, rendu)
src/desktop-inject.js  Bootstrap du wrapper Electron (lit window.__CT_SETTINGS__)
src/panel.js       UI du panneau (Shadow DOM isolé du CSS du site), rendu de l'arbre
src/content.js     Bootstrap extension (content script, chrome.storage)
options.html/.js   Page de réglages de l'extension
desktop/           App Electron : main.js, shell (toolbar), settings, réglages JSON
```

## Ajouter une nouvelle IA

Dans `src/adapters.js`, ajoutez une entrée de plateforme :

```js
{
  id: 'monia',
  test(h) { return /(^|\.)monia\.com$/.test(h); },
  user: ['.selecteur-messages-utilisateur'],
  heading: 'h1,h2,h3,h4,h5'
}
```

- `user` : sélecteurs CSS des messages utilisateur, testés dans l'ordre (le premier trouvé est utilisé). En dernier recours la liste **universelle** (`data-testid`/`data-test-id`, `user-message`, `user-query`, …) est tentée.
- `heading` : sélecteur des titres à extraire dans les réponses ; les titres sont ensuite **groupés au message utilisateur précédent** (ordre du document), indépendamment des blocs « réponse IA » (souvent virtualisés ou renommés).
- Sans sélecteurs connus, le mode **générique** tente une détection automatique.

## Notes

- L'analyse repose sur le DOM rendu : si une plateforme **virtualise** ses messages (décharge les anciens pendant le scroll), l'arbre reflète les messages actuellement chargés par la page.
- Aucune donnée n'est collectée ni envoyée : tout reste local dans votre navigateur. Les sélecteurs de `src/adapters.js` peuvent devenir obsolètes si les sites modifient leur DOM.

---

## Applications de bureau (wrapper Electron)

L'extension ne fonctionne que dans le navigateur. Pour **apps de bureau** (Claude, Gemini, Kimi et autres), un **wrapper Electron** réutilise exactement le même code d'analyse (`src/core.js`, `src/adapters.js`, `src/runtime.js`, `src/panel.js`) : il charge le chat dans sa propre `WebContentsView` et y injecte le bundle comme le ferait un content script.

### Comment ça marche

1. `desktop/main.js` (processus principal) ouvre une fenêtre avec **toolbar** (précédent/suivant, accueil, plateformes, réglages, devtools, ouvrir dans le navigateur) et une `WebContentsView` plein contenu.
2. À chaque navigation terminée (`did-finish-load`, y compris sous-frames), il **concatène** `core + adapters + runtime + panel + desktop-inject.js` et l'injecte dans la page (`executeJavaScript`/`executeJavaScriptInFrame`).
3. `src/desktop-inject.js` joue le rôle de `content.js` mais lit ses réglages depuis `window.__CT_SETTINGS__` (préfixe injecté par le wrapper) au lieu de `chrome.storage`.
4. Les **réglages** (plateforme par défaut, plateformes activées, niveau de titre) sont stockés dans un JSON local (`userData/ct-settings.json`) ; sauvegarder recharge le chat.
5. La session (cookies/identifiants) est persistée dans l'instance Electron : on se connecte une seule fois.

### Lancer

```
cd desktop
npm install
npm start          # lance l'app (Claude par défaut)
npm run smoke      # test automatique : charge, injecte, affiche SMOKE_OK/FAIL et quitte
```

### Limites actuelles

- **Authentification** : chaque plateforme (claude.ai, gemini, kimi, perplexity, copilot, grok) demande une connexion dans la fenêtre wrapper, via compte normal.
- Vérifier la conformité d'utilisation avec les conditions de chaque plateforme avant une mise en production.
- Le wrapper est un bac à sable de confiance : c'est *l'app de l'utilisateur* qui est chargée, pas du contenu inconnu ; l'injection est effectuée uniquement sur les pages de chat.

### Vers la production (extension + wrapper)

Une fois les tests validés :
- **Emballage** : voir [electron-builder](https://www.electron.build/) (MSI/NSIS pour Windows), icône et signature incluses.
- **Store** : Chrome Web Store pour l'extension (permissions minimales déjà en place).