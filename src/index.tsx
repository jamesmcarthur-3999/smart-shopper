import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Make sure the env object is available
declare global {
  interface Window {
    env: Record<string, string>;
  }
}

// Initialize env with defaults if not set by env-config.js
window.env = window.env || {
  NODE_ENV: 'development',
  APP_PORT: '3000',
  ENABLE_CACHING: 'true',
  MAX_CARDS_PER_VIEW: '12'
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
