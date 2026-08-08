import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { LocalizationProvider } from './util/LocalizationContext';
import { loadContentPool } from './util/contentPool';

// Load the content pool before mounting React so components can read it
// synchronously (see getContentPool). Shows a loading message meanwhile.
const root = document.getElementById('root');
root.textContent = 'Loading OATutor…';

loadContentPool()
    .then(() => {
        ReactDOM.render(
            <LocalizationProvider>
                <App />
            </LocalizationProvider>,
            root
        );
    })
    .catch((err) => {
        console.error('Failed to load content pool:', err);
        root.textContent = 'Failed to load content. See the console for details.';
    });

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
