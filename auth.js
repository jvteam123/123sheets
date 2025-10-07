import { config } from './config.js';

let tokenClient;
let onAuthChangeCallback;
let signInButton;

export function initClient(callback, button) {
    onAuthChangeCallback = callback;
    signInButton = button;

    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                apiKey: config.google.API_KEY,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });

            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: config.google.CLIENT_ID,
                scope: config.google.SCOPES,
                callback: handleTokenResponse,
            });

            // Enable the sign-in button now that the client is ready
            if (signInButton) {
                signInButton.disabled = false;
                signInButton.textContent = 'Sign in with Google';
            }

            tokenClient.requestAccessToken({ prompt: 'none' });

        } catch (error) {
            console.error("GAPI Error: Failed to initialize GAPI client.", error);
            if (signInButton) {
                signInButton.textContent = 'Error - Refresh';
            }
        }
    });
}

function handleTokenResponse(resp) {
    if (resp && resp.access_token) {
        gapi.client.setToken(resp);
        onAuthChangeCallback(true);
    } else {
        onAuthChangeCallback(false);
    }
}

export function handleAuthClick() {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        console.error("Auth client not initialized.");
    }
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
