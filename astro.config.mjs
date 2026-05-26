import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';

export default defineConfig({
  site: 'https://eddieberu.github.io/Indice-Conocimiento-Programacion4/',
  base: '/Indice-Conocimiento-Programacion4/',
  build: { format: 'file' },
  integrations: [relativeLinks()]
});
