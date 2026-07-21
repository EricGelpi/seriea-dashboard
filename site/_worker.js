// Cloudflare Pages Function: protegge l'intero sito con una password
// (HTTP Basic Auth). Va messo nella RADICE della cartella pubblicata
// (stesso livello di serie_a_analytics.html) col nome esatto "_worker.js":
// Cloudflare lo esegue automaticamente prima di servire i file statici.
//
// La password NON è scritta qui: viene letta da due variabili d'ambiente
// segrete impostate nel pannello Cloudflare Pages (Settings > Environment
// variables), cosi' anche se il repository GitHub è pubblico la password
// resta privata.
//   DASH_USER  -> es. "bamba"
//   DASH_PASS  -> la tua password a scelta

export default {
  async fetch(request, env) {
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
