import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { initSettings } from './settings/useSettings.js';
import App from './App.jsx';
import './index.css';

initSettings();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);
