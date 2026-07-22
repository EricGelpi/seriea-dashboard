// Cloudflare Worker che protegge l'intero sito con una password (HTTP Basic
// Auth). Vive nella RADICE del repository (accanto a deploy.py), NON dentro
// site/: e' referenziato come entry point tramite "main" in wrangler.jsonc,
// cosi' Cloudflare lo esegue come logica del worker invece di pubblicarlo
// come file statico scaricabile (l'errore di build "Uploading a Pages
// _worker.js file as an asset" succedeva proprio perche' prima stava dentro
// site/ senza questa configurazione esplicita).
// La password NON è scritta qui: viene letta da due variabili d'ambiente
// segrete impostate nel pannello Cloudflare Pages (Settings > Environment
// variables), cosi' anche se il repository GitHub è pubblico la password
// resta privata.
//   DASH_USER  -> es. "bamba"
//   DASH_PASS  -> la tua password a scelta

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Questi file non contengono nessun dato personale: il browser deve
    // poterli leggere liberamente per capire che il sito e' "installabile"
    // come app. Solo la dashboard vera (l'HTML con i pronostici) resta
    // dietro password.
    const PUBLIC_PATHS = [
      '/manifest.json',
      '/service-worker.js',
      '/icon-192.png',
      '/icon-512.png',
      '/apple-touch-icon.png'
    ];
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    const user = env.DASH_USER;
    const pass = env.DASH_PASS;

    // Se le variabili non sono configurate, meglio bloccare tutto che
    // lasciare il sito aperto per errore di configurazione.
    if (!user || !pass) {
      return new Response('Configurazione mancante: imposta DASH_USER e DASH_PASS nelle variabili d\'ambiente di Cloudflare Pages.', { status: 500 });
    }

    const auth = request.headers.get('Authorization');
    const expected = 'Basic ' + btoa(user + ':' + pass);

    if (auth !== expected) {
      return new Response('Accesso protetto. Inserisci utente e password.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Serie A Analytics", charset="UTF-8"' }
      });
    }

    // Credenziali corrette: lascia proseguire la richiesta verso l'asset
    // statico richiesto (serie_a_analytics.html, manifest.json, ecc.).
    return env.ASSETS.fetch(request);
  }
};
