import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/* Tipografia auto-hospedada — nenhuma requisição a terceiros. Os .woff2
   entram no bundle com hash e cache imutável, e o unicode-range de cada
   arquivo garante que só o subconjunto latino seja baixado.
   Archivo (variável) = títulos · IBM Plex Sans = interface
   IBM Plex Mono = leituras numéricas (o "mostrador" do produto) */
import '@fontsource-variable/archivo/wght.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-500.css';

import './index.css';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado no documento.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
