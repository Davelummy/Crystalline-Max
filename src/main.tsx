import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import 'react-day-picker/dist/style.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { initSentry, SentryErrorBoundary } from './lib/sentry.tsx';
import './index.css';

void initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SentryErrorBoundary>
  </StrictMode>,
);
