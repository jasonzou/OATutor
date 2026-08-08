import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// Titillium Web font, bundled locally (replaces the Google Fonts CDN link in
// index.html) so the desktop app is fully offline.
import "@fontsource/titillium-web/300.css";
import "@fontsource/titillium-web/400.css";
import "@fontsource/titillium-web/700.css";
import App from './App';
import * as serviceWorker from './serviceWorker';
import { LocalizationProvider } from './util/LocalizationContext';
import { loadContentPool } from './util/contentPool';
import { hydrateFromDesktop } from './util/desktopStorage';
import { USER_ID_STORAGE_KEY } from './config/config';

// Load the content pool before mounting React so components can read it
// synchronously (see getContentPool). Shows a loading message meanwhile.
const root = document.getElementById('root');
root.textContent = 'Loading OATutor…';

(async () => {
    await hydrateFromDesktop([USER_ID_STORAGE_KEY]);
    await loadContentPool();
    ReactDOM.render(
        <LocalizationProvider>
            <App />
        </LocalizationProvider>,
        root
    );
})().catch((err) => {
    console.error('Failed to start OATutor:', err);
    root.textContent = 'Failed to load content. See the console for details.';
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
