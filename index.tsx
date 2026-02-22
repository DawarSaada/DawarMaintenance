
import React from 'https://esm.sh/react@19.0.0';
import ReactDOM from 'https://esm.sh/react-dom@19.0.0/client';
import App from './App.tsx';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
