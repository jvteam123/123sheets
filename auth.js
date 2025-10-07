import { config } from './config.js';

let tokenClient;
let onAuthChangeCallback;

export function initClient(callback) {
    onAuthChangeCallback = callback;
    gapi.load('client', async () => {
        await gapi.client.init({
            apiKey: config.google.API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: config.google.CLIENT_ID,
            scope: config.google.SCOPES,
            callback: handleTokenResponse,
        });
        // Check for existing session
        tokenClient.requestAccessToken({ prompt: 'none' });
    });
}

function handleTokenResponse(resp) {
    if (resp && resp.access_token) {
        gapi.client.setToken(resp);
        onAuthChangeCallback(true);
    } else {
        // This can happen on first load if user is not signed in
        onAuthChangeCallback(false);
    }
}

export function handleAuthClick() {
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

export function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            onAuthChangeCallback(false);
        });
    }
}
