#!/usr/bin/env python3
"""
Pubblica online l'ultima versione della dashboard.

Cosa fa:
1. Copia serie_a_analytics.html, manifest.json e le icone dalla cartella
   principale del progetto dentro cloud_deploy/site/ (la cartella
   effettivamente pubblicata online).
2. Fa commit + push su GitHub.
3. Cloudflare Pages, collegato al repository, si accorge del nuovo push e
   ripubblica automaticamente il sito in una manciata di secondi.

Va lanciato UNA VOLTA alla fine della pipeline (es. in coda a
00_run_pipeline.py, o semplicemente eseguito a mano dopo averla lanciata).

Richiede una configurazione iniziale UNA TANTUM (vedi ISTRUZIONI.md nella
stessa cartella): repository GitHub creato, collegato come "origin", e git
gia' autenticato su questo PC (es. con un Personal Access Token salvato una
volta nel credential manager di git).
"""
import shutil
import subprocess
import sys
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent.parent  # cartella principale del progetto
SITE_DIR = Path(__file__).resolve().parent / 'site'    # cartella pubblicata online

FILES_TO_SYNC = [
    'serie_a_analytics.html',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
    'service-worker.js',
]
# index.html e _worker.js vivono gia' dentro cloud_deploy/site/ e non
# vengono toccati da questo script (non cambiano da un aggiornamento
# all'altro dei dati).

def run(cmd, cwd):
    print('>', ' '.join(cmd))
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.stdout.strip():
        print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
    return result.returncode

def main():
    SITE_DIR.mkdir(parents=True, exist_ok=True)

    print('Copio i file aggiornati...')
    for name in FILES_TO_SYNC:
        src = PROJECT_DIR / name
        if not src.exists():
            print(f'  ATTENZIONE: {name} non trovato, salto.')
            continue
        shutil.copy2(src, SITE_DIR / name)
        print(f'  copiato {name}')

    cwd = Path(__file__).resolve().parent  # cloud_deploy/ deve essere una repo git

    if not (cwd / '.git').exists():
        print('\nQuesta cartella non e\' ancora collegata a un repository git.')
        print('Segui ISTRUZIONI.md per la configurazione iniziale (una tantum), poi rilancia questo script.')
        sys.exit(1)

    run(['git', 'add', '-A'], cwd=cwd)
    msg = f'Aggiornamento dashboard {datetime.now().strftime("%Y-%m-%d %H:%M")}'
    commit_code = run(['git', 'commit', '-m', msg], cwd=cwd)
    if commit_code != 0:
        print('Nessuna modifica da pubblicare (i dati non sono cambiati).')
        return
    push_code = run(['git', 'push'], cwd=cwd)
    if push_code == 0:
        print('\nPubblicato! Cloudflare Pages ripubblichera\' il sito entro pochi secondi.')
    else:
        print('\nErrore durante il push: controlla la connessione o le credenziali git.')

if __name__ == '__main__':
    main()
