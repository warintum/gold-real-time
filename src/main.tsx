import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { serviceWorkerManager } from '@/utils/serviceWorker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    serviceWorkerManager.register()
      .then((registered) => {
        if (registered) {
          console.log('[App] Service Worker registered successfully');
        } else {
          console.log('[App] Service Worker registration failed or not supported');
        }
      })
      .catch((error) => {
        console.error('[App] Service Worker registration error:', error);
      });
  });
}
