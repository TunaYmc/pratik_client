import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import axios from 'axios';

// API İstekleri için kök URL'i ayarla (Derleme anında VITE_API_URL ortam değişkeninden alınır)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
