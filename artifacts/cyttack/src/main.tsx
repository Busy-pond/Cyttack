import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Point the API client at the configured backend.
// VITE_API_URL is unset in Replit (same-domain /api/* routing via shared proxy)
// and should be set to the full API server URL for external / Vercel deployments.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById('root')!).render(<App />);
