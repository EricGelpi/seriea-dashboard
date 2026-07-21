# Mettere la dashboard online (una tantum)

Dopo questa configurazione iniziale, ogni aggiornamento futuro sarà
automatico: lanci la pipeline, poi `python3 deploy.py`, e in pochi secondi
la versione online è aggiornata — nessun altro passaggio manuale.

Tempo richiesto: ~15-20 minuti la prima volta.

---

## 1. Crea un account GitHub (se non ce l'hai già)

https://github.com/signup — gratuito.

## 2. Crea un nuovo repository

- Vai su https://github.com/new
- Nome repository: es. `seriea-dashboard`
- Visibilità: **Public** (va bene: la password protegge comunque i
  contenuti, vedi punto 5 — solo il codice del sito sarà visibile, non i
  tuoi dati/pronostici, che restano dietro la password)
- Non aggiungere README/licenza, lascialo vuoto
- Clicca "Create repository"

## 3. Collega questa cartella (`cloud_deploy`) al repository

Apri un terminale **dentro la cartella `cloud_deploy`** ed esegui, una alla
volta (sostituisci `TUO-USERNAME` con il tuo nome utente GitHub):

```
git init
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/seriea-dashboard.git
python3 deploy.py
```

Se GitHub ti chiede di autenticarti (username + password): GitHub non
accetta più la password normale per queste operazioni, serve un "Personal
Access Token":
- Vai su https://github.com/settings/tokens → "Generate new token (classic)"
- Seleziona lo scope "repo", genera il token, copialo
- Quando il terminale chiede la password, incolla il token al posto suo
  (una volta salvato dal git credential manager di Windows/macOS, non te
  lo richiederà più)

## 4. Collega Cloudflare Pages al repository

- Crea un account gratuito su https://dash.cloudflare.com/sign-up
- Nel menu laterale: "Workers & Pages" → "Create" → scheda "Pages" →
  "Connect to Git"
- Autorizza Cloudflare ad accedere al tuo account GitHub, seleziona il
  repository `seriea-dashboard`
- Impostazioni di build:
  - Framework preset: **None**
  - Build command: **(lascia vuoto)**
  - Build output directory: **site**
- Clicca "Save and Deploy"

Dopo 1-2 minuti ti darà un indirizzo tipo:
`https://seriea-dashboard.pages.dev`

## 5. Imposta la password

- Nel progetto Cloudflare Pages appena creato: "Settings" → "Environment
  variables"
- Aggiungi due variabili (per l'ambiente "Production", e ripeti anche per
  "Preview" se vuoi che valga anche lì):
  - `DASH_USER` = un nome utente a tua scelta (es. `bamba`)
  - `DASH_PASS` = la tua password a scelta — clicca sull'icona "Encrypt"
    per renderla segreta
- Salva, poi vai su "Deployments" → sui tre puntini dell'ultimo
  deployment → "Retry deployment" (cosi' le variabili vengono applicate)

Da questo momento, aprendo il link, il browser chiederà utente e password
prima di mostrare qualunque contenuto.

## 6. Fatto

Apri `https://seriea-dashboard.pages.dev` da telefono, inserisci
utente/password quando richiesto, poi "Aggiungi a schermata Home" come
fatto in locale — ora però funziona da ovunque, senza bisogno che il PC sia
acceso, e con offline reale grazie all'HTTPS.

---

## Da qui in avanti (uso quotidiano)

Ogni volta che rilanci la pipeline e vuoi pubblicare i nuovi dati:

```
cd cloud_deploy
python3 deploy.py
```

Tutto qui: copia i file aggiornati, fa commit e push, Cloudflare
ripubblica da solo. Se vuoi renderlo *davvero* automatico (zero comandi da
digitare), aggiungi questa riga in fondo a `00_run_pipeline.py`:

```python
import subprocess
subprocess.run(['python3', 'cloud_deploy/deploy.py'], cwd=<percorso del progetto>)
```

così parte da sola ogni volta che la pipeline finisce.
